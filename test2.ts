import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key");
    return;
  }
  const genAI = new GoogleGenAI({ apiKey });
  
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro"];
  
  for (const m of models) {
      try {
        console.log(`Testing ${m}...`);
        const res = await (genAI as any).models.generateContent({
          model: m,
          contents: "hello"
        });
        console.log(`Success ${m}:`, res.text);
        return; // Stop on first success
      } catch (e: any) {
        console.error(`Failed ${m}:`, e.message);
      }
  }
  
  // Test embedding too since it's used in the app
  try {
     const emb = await (genAI as any).models.embedContent({
         model: "text-embedding-004",
         contents: "hello"
     });
     console.log("Embed success:", !!emb.embeddings);
  } catch (e: any) {
     console.error("Embed failed:", e.message);
  }
}

test();
