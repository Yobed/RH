import { GoogleGenAI } from "@google/genai";

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key");
    return;
  }
  const genAI = new GoogleGenAI({ apiKey });
  try {
    // Check if this syntax works
    console.log("Testing with gemini.models.generateContent...");
    const res = await (genAI as any).models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: "Bonjour" }] }]
    });
    console.log("Success:", res.text);
  } catch (e) {
    console.error("Failed:", e);
  }
}

test();
