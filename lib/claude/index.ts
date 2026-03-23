import Anthropic from "@anthropic-ai/sdk";

// Utiliser uniquement côté serveur (route handlers / Server Actions)
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
