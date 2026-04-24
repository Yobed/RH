import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { gemini, GEMINI_FLASH } from "@/lib/gemini";

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  question: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

const SYSTEM_PROMPT = `Tu es un assistant juridique expert en droit du travail ivoirien (Loi n°2015-532 du 20 juillet 2015 portant Code du Travail et les conventions collectives de Côte d'Ivoire).

Règles absolues :
- Réponds uniquement en français
- Cite toujours les articles pertinents quand tu les connais (ex: "Art. 18 Code du Travail CI")
- Sois précis, concret et adapté au contexte des entreprises ivoiriennes
- Si une question dépasse le droit du travail ivoirien, signale-le
- N'invente jamais d'articles ou de textes de loi

Références clés que tu maîtrises :
- CDD : durée max 2 ans, max 2 renouvellements → conversion automatique en CDI (Art. 12)
- Préavis CDI licenciement : 8 jours (essai), 1 mois (ouvriers), 3 mois (cadres/agents maîtrise) (Art. 16)
- Indemnité de licenciement : 1/12 du salaire annuel brut × années d'ancienneté (Art. 74)
- Délai saisine Inspection du Travail : 15 jours (Art. 80)
- Prescription : 2 ans (Art. 82)
- Congés payés : 2,2 jours ouvrables/mois de service effectif = 26,4 jours/an (Art. 25)
- Période d'essai CDI : 1 mois (ouvriers), 3 mois (agents de maîtrise), 6 mois (cadres) (Art. 14)
- Heures supplémentaires : majorées de 15% à 50% selon horaire et jour
- SMIG : fixé par arrêté du Ministre chargé du Travail`;

type ContextChunk = {
  titre: string;
  contenu: string;
  source: string;
};

export async function POST(req: Request) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Question invalide" }, { status: 400 });
  }

  const { question, history } = parsed.data;
  let contextChunks: ContextChunk[] = [];
  let usedRag = false;

  // ✅ PARALLÈLE — RAG n8n + reformulation Gemini Flash simultanément
  const n8nBase = process.env.N8N_BASE_URL;

  const [ragResult, geminiReformulation] = await Promise.all([
    // RAG via n8n (embedding pgvector)
    n8nBase
      ? fetch(`${n8nBase}/webhook/rag/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
          signal: AbortSignal.timeout(8000),
        })
          .then(async (res) => {
            if (!res.ok) return null;
            return res.json() as Promise<{ chunks?: ContextChunk[] }>;
          })
          .catch(() => null)
      : Promise.resolve(null),

    // Gemini Flash reformule la question pour améliorer la pertinence RAG
    gemini.models.generateContent({
      model: GEMINI_FLASH,
      contents: `Reformule cette question RH en termes juridiques précis pour une recherche documentaire sur le droit du travail ivoirien. Réponds UNIQUEMENT par la question reformulée, sans explication.

Question originale : "${question}"`,
    }),
  ]);

  // Traitement RAG n8n
  if (ragResult && Array.isArray(ragResult.chunks) && ragResult.chunks.length > 0) {
    contextChunks = ragResult.chunks.slice(0, 4);
    usedRag = true;
  }

  // Si n8n n'a rien retourné, fallback Supabase avec la question reformulée par Gemini
  if (!usedRag) {
    const questionRecherche = geminiReformulation.text?.trim() ?? question;
    const keywords = questionRecherche
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 5);

    if (keywords.length > 0) {
      const { data: docs } = await supabase
        .from("legal_documents")
        .select("titre, contenu, source")
        .or(keywords.map((k) => `contenu.ilike.%${k}%`).join(","))
        .limit(3);

      if (docs && docs.length > 0) {
        contextChunks = docs;
        usedRag = true;
      }
    }
  }

  // Construire les messages pour Claude
  const contextBlock =
    contextChunks.length > 0
      ? `\n\n--- SOURCES DOCUMENTAIRES ---\n${contextChunks
          .map((c, i) => `[Source ${i + 1}] ${c.titre} (${c.source})\n${c.contenu}`)
          .join("\n\n")}\n--- FIN SOURCES ---`
      : "";

  const claudeMessages: { role: "user" | "assistant"; content: string }[] = [
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    {
      role: "user" as const,
      content: contextBlock ? `${question}${contextBlock}` : question,
    },
  ];

  // Appel Claude avec contexte enrichi
  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: claudeMessages,
    });

    const answer =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      answer,
      sources: contextChunks.map((c) => ({ titre: c.titre, source: c.source })),
      used_rag: usedRag,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la génération de la réponse IA. Réessayez." },
      { status: 502 }
    );
  }
}

