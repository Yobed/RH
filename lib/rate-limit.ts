/**
 * Rate limiter simple en mémoire — edge-compatible
 * Pour production, remplacer par Upstash Redis ou Cloudflare KV.
 *
 * Usage:
 *   const { success, remaining } = checkRateLimit(req, { limit: 10, windowMs: 60_000 });
 *   if (!success) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitOptions {
  limit: number;        // nombre max de requêtes
  windowMs: number;     // fenêtre temporelle en ms
  key?: string;         // clé additionnelle (ex: nom de la route)
}

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Nettoyage périodique pour éviter les fuites mémoire
let lastClean = Date.now();
function cleanStore() {
  const now = Date.now();
  if (now - lastClean < 60_000) return;
  lastClean = now;
  store.forEach((v, k) => {
    if (now > v.resetAt) store.delete(k);
  });
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): { success: boolean; remaining: number; resetAt: number } {
  cleanStore();
  const { limit, windowMs, key = "" } = options;
  const ip = getClientIp(req);
  const storeKey = `${ip}:${key}`;
  const now = Date.now();

  const entry = store.get(storeKey);

  if (!entry || now > entry.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;

  return { success, remaining, resetAt: entry.resetAt };
}

/** Retourne une réponse 429 standardisée avec headers Retry-After */
export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Trop de requêtes — réessayez dans quelques instants." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  );
}
