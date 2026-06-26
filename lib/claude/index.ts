import { type Part } from "@google/genai";
import { gemini, GEMINI_FLASH } from "@/lib/gemini";

// ─────────────────────────────────────────────────────────────────────────────
// Adaptateur IA — Anthropic → Google Gemini (gratuit)
//
// L'app a été écrite pour Claude (Anthropic) mais la clé ANTHROPIC_API_KEY n'est
// pas fournie. Ce module ré-expose la MÊME interface `anthropic.messages.create()`
// (et `CLAUDE_MODEL`) tout en propulsant les appels avec Google Gemini, déjà
// configuré via GEMINI_API_KEY. Résultat : aucune route métier à réécrire —
// l'orchestrateur, l'analyse de documents (multimodal) et le scoring CV
// continuent de fonctionner, sans dépendance à Anthropic.
// ─────────────────────────────────────────────────────────────────────────────

// Alias conservé pour compatibilité avec le code existant (`model: CLAUDE_MODEL`).
export const CLAUDE_MODEL = GEMINI_FLASH;

type AnthropicTextBlock = { type: "text"; text: string };
type AnthropicMediaBlock = {
  type: "document" | "image";
  source: { type: "base64"; media_type: string; data: string };
};
type AnthropicContentBlock = AnthropicTextBlock | AnthropicMediaBlock;

interface AnthropicMessage {
  role: string;
  content: string | AnthropicContentBlock[];
}

interface MessagesCreateParams {
  model?: string;
  max_tokens?: number;
  system?: string;
  messages: AnthropicMessage[];
}

interface MessagesCreateResult {
  content: [{ type: "text"; text: string }];
}

// Traduit les messages au format Anthropic vers des `parts` Gemini (texte + base64).
function messagesToParts(messages: AnthropicMessage[], system?: string): Part[] {
  const parts: Part[] = [];
  if (system) parts.push({ text: system });

  for (const message of messages) {
    if (typeof message.content === "string") {
      parts.push({ text: message.content });
      continue;
    }
    for (const block of message.content) {
      if (block.type === "text") {
        parts.push({ text: block.text });
      } else {
        // `document` (PDF) et `image` → inlineData multimodal Gemini
        parts.push({
          inlineData: {
            mimeType: block.source.media_type,
            data: block.source.data,
          },
        });
      }
    }
  }
  return parts;
}

export const anthropic = {
  messages: {
    async create(params: MessagesCreateParams): Promise<MessagesCreateResult> {
      const parts = messagesToParts(params.messages, params.system);
      const response = await gemini.models.generateContent({
        model: GEMINI_FLASH,
        contents: parts,
      });
      return { content: [{ type: "text", text: response.text ?? "" }] };
    },
  },
};
