/**
 * Régénère les embeddings de la table legal_documents.
 *
 * Modèle : gemini-embedding-001 (768 dims via outputDimensionality)
 * Compatible avec la fonction RPC match_legal_documents existante.
 *
 * Usage :
 *   node scripts/reindex-legal-documents.mjs            # docs sans embedding
 *   node scripts/reindex-legal-documents.mjs --all      # tous les docs (force regen)
 */

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Charge .env.local
try {
  const envFile = readFileSync(".env.local", "utf-8");
  for (const line of envFile.split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {
  // OK si .env.local absent (CI / Vercel)
}

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!SUPA_URL || !SUPA_KEY || !GEMINI_KEY) {
  console.error("❌ Variables d'env manquantes : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY");
  process.exit(1);
}

const supa = createClient(SUPA_URL, SUPA_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

const args = new Set(process.argv.slice(2));
const FORCE_ALL = args.has("--all");
const BATCH_DELAY_MS = 1100; // ~55 req/min, sous le quota gratuit

async function embed(text) {
  // Format de tâche optimal pour la recherche dans une base documentaire
  const r = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: {
      outputDimensionality: 1536,
      taskType: "RETRIEVAL_DOCUMENT",
    },
  });
  return r.embeddings?.[0]?.values;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`🔧 Mode : ${FORCE_ALL ? "tous les documents (force)" : "documents sans embedding uniquement"}`);

  const query = supa.from("legal_documents").select("id, titre, source, contenu");
  const { data: docs, error } = FORCE_ALL
    ? await query
    : await query.is("embedding", null);

  if (error) {
    console.error("❌ Lecture table:", error.message);
    process.exit(1);
  }

  if (!docs || docs.length === 0) {
    console.log("✅ Aucun document à indexer.");
    return;
  }

  console.log(`📚 ${docs.length} document(s) à traiter\n`);

  let ok = 0;
  let ko = 0;
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    const label = `[${i + 1}/${docs.length}]`;
    const titre = (d.titre || d.source || "").slice(0, 60);

    if (!d.contenu || d.contenu.length < 10) {
      console.log(`${label} ⚠️  Contenu vide → ignoré (${titre})`);
      ko++;
      continue;
    }

    // On indexe sur titre + source + contenu pour enrichir le signal
    const textToEmbed = [d.titre, d.source, d.contenu].filter(Boolean).join("\n\n");

    try {
      const vector = await embed(textToEmbed);

      if (!vector || vector.length !== 1536) {
        console.log(`${label} ❌ Embedding invalide (${vector?.length} dims) — ${titre}`);
        ko++;
        continue;
      }

      const { error: updErr } = await supa
        .from("legal_documents")
        .update({ embedding: vector })
        .eq("id", d.id);

      if (updErr) {
        console.log(`${label} ❌ UPDATE échoué — ${titre}: ${updErr.message}`);
        ko++;
        continue;
      }

      console.log(`${label} ✅ ${titre}`);
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`${label} ❌ Embedding échoué — ${titre}: ${msg.slice(0, 120)}`);
      ko++;
    }

    if (i < docs.length - 1) await sleep(BATCH_DELAY_MS);
  }

  console.log(`\n📊 Bilan : ${ok} ✅  /  ${ko} ❌`);
}

await main();
