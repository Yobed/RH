import { GoogleGenAI } from "@google/genai";

// Utiliser uniquement côté serveur (route handlers / Server Actions)
// Jamais depuis un Client Component — respecte la règle CLAUDE.md
// L'erreur est levée à l'appel, pas au chargement du module (évite crash build Vercel)
export function getGemini(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY manquant dans les variables d'environnement");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

// Modèles disponibles — toujours utiliser les versions stables
// gemini-1.5-flash : très rapide, fiable, gratuit → excellent pour le RAG
// gemini-1.5-pro   : raisonnement approfondi
export const GEMINI_FLASH = "gemini-2.5-flash";
export const GEMINI_PRO   = "gemini-2.5-pro";
