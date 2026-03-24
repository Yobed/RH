/**
 * auto-login.mjs — Connexion automatique via injection de cookies Supabase SSR
 *
 * Implémente la même logique de fragmentation que @supabase/ssr (createChunks)
 * pour injecter correctement la session dans le navigateur via les cookies.
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lire .env.local
const envPath = resolve(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const ANON_KEY = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const APP_ORIGIN = "http://localhost:3002";
const EMAIL = "admin@yobed.ci";
const PASSWORD = "Waliyatb1";

const SUPABASE_REF = SUPABASE_URL.replace("https://", "").split(".")[0];
const MAX_CHUNK_SIZE = 3180;

/** Reproduit createChunks de @supabase/ssr */
function createChunks(key, value) {
  let encodedValue = encodeURIComponent(value);
  if (encodedValue.length <= MAX_CHUNK_SIZE) {
    return [{ name: key, value }];
  }
  const chunks = [];
  while (encodedValue.length > 0) {
    let encodedChunkHead = encodedValue.slice(0, MAX_CHUNK_SIZE);
    const lastEscapePos = encodedChunkHead.lastIndexOf("%");
    if (lastEscapePos > MAX_CHUNK_SIZE - 3) {
      encodedChunkHead = encodedChunkHead.slice(0, lastEscapePos);
    }
    let valueHead = "";
    while (encodedChunkHead.length > 0) {
      try {
        valueHead = decodeURIComponent(encodedChunkHead);
        break;
      } catch (error) {
        if (error instanceof URIError && encodedChunkHead.at(-3) === "%" && encodedChunkHead.length > 3) {
          encodedChunkHead = encodedChunkHead.slice(0, encodedChunkHead.length - 3);
        } else {
          throw error;
        }
      }
    }
    chunks.push(valueHead);
    encodedValue = encodedValue.slice(encodedChunkHead.length);
  }
  return chunks.map((v, i) => ({ name: `${key}.${i}`, value: v }));
}

async function main() {
  console.log("\n🔑 Connexion via l'API Supabase REST...");

  const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!resp.ok) {
    const err = await resp.json();
    console.error("❌ Erreur API Supabase:", err.error_description || err.error || JSON.stringify(err));
    process.exit(1);
  }

  const session = await resp.json();
  console.log("✅ Session obtenue !");
  console.log("   User:", session.user?.email);

  // Construire le payload de session au format @supabase/ssr
  const expiresAt = Math.floor(Date.now() / 1000) + session.expires_in;
  const sessionPayload = JSON.stringify({
    access_token: session.access_token,
    token_type: "bearer",
    expires_in: session.expires_in,
    expires_at: expiresAt,
    refresh_token: session.refresh_token,
    user: session.user,
  });

  const cookieKey = `sb-${SUPABASE_REF}-auth-token`;
  const cookieChunks = createChunks(cookieKey, sessionPayload);

  console.log(`\n🍪 ${cookieChunks.length} cookie(s) à injecter`);
  cookieChunks.forEach((c) => console.log(`   ${c.name} (${c.value.length} chars)`));

  // Lancer le navigateur
  console.log("\n🚀 Lancement du navigateur...");
  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });
  const context = await browser.newContext({ viewport: null });

  // Injecter les cookies
  await context.addCookies(
    cookieChunks.map((chunk) => ({
      name: chunk.name,
      value: chunk.value,
      domain: "localhost",
      path: "/",
      expires: expiresAt,
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    }))
  );

  console.log("✅ Cookies injectés !");

  // Naviguer vers le dashboard
  const page = await context.newPage();
  console.log("🏠 Navigation vers /rh...");
  await page.goto(`${APP_ORIGIN}/rh`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const finalUrl = page.url();
  console.log("   URL finale:", finalUrl);

  if (finalUrl.includes("/rh")) {
    console.log("\n✅ CONNEXION RÉUSSIE ! Dashboard RH accessible.");
    await page.screenshot({ path: "scripts/login-debug.png" });
    console.log("📸 Screenshot: scripts/login-debug.png");
  } else {
    console.log("⚠️  Non connecté. URL:", finalUrl);

    // Debug: afficher les cookies actuellement dans le contexte
    const cookies = await context.cookies(`${APP_ORIGIN}`);
    console.log(`   Cookies (${cookies.length}):`);
    cookies.forEach((c) => console.log(`     ${c.name}: ${c.value.substring(0, 50)}...`));

    await page.screenshot({ path: "scripts/login-debug.png" });
    console.log("📸 Screenshot: scripts/login-debug.png");
  }

  console.log("\n⏳ Navigateur ouvert. Fermez-le manuellement.\n");
  await new Promise(() => {});
}

main().catch((e) => {
  console.error("❌ Erreur:", e.message);
  process.exit(1);
});
