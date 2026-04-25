import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
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

  const n8nBase = process.env.N8N_BASE_URL;

  const [ragResult, reformulationResult] = await Promise.all([
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

    gemini.models.generateContent({
      model: GEMINI_FLASH,
      contents: [{ role: "user", parts: [{ text: `En tant qu'expert juridique RH, reformule cette question pour une recherche précise dans le Code du Travail Ivoirien. Réponds EXCLUSIVEMENT par la question courte reformulée.
      
Question : "${question}"` }] }],
      config: { temperature: 0.1 }
    }).catch(() => null),
  ]);

  const searchQueries = [question];
  if (reformulationResult && (reformulationResult as any).text) {
    searchQueries.unshift((reformulationResult as any).text.trim());
  }

  if (ragResult && Array.isArray(ragResult.chunks) && ragResult.chunks.length > 0) {
    contextChunks = ragResult.chunks.slice(0, 4);
    usedRag = true;
  }

  if (!usedRag) {
    try {
      // Rechercher avec la question reformulée prioritairement
      const searchQuery = searchQueries[0];
      
      const embeddingResult = await gemini.models.embedContent({
        model: "text-embedding-004",
        contents: [{ parts: [{ text: searchQuery }] }]
      });
      
      const embedding = embeddingResult.embeddings?.[0]?.values;

      if (embedding) {
        const { data: matchedDocs, error: rpcError } = await supabase.rpc("match_legal_documents", {
          query_embedding: embedding,
          match_threshold: 0.2, // Légèrement plus bas pour plus de rappel
          match_count: 5,
        });

        if (!rpcError && matchedDocs && matchedDocs.length > 0) {
          contextChunks = matchedDocs.map((doc: any) => ({
            titre: doc.source || "Document Juridique",
            contenu: doc.contenu,
            source: doc.source,
          }));
          usedRag = true;
        }
      }
    } catch (err) {
      console.error("[rag/query] Semantic search error:", err);
    }

    if (!usedRag) {
      console.log(`[rag/query] Semantic search failed, trying keywords with: ${searchQueries[0]}`);
      const keywords = searchQueries[0].split(/\s+/).filter(w => w.length > 3).slice(0, 5);
      if (keywords.length > 0) {
        const { data: docs, error: keywordError } = await supabase
          .from("legal_documents")
          .select("titre, contenu, source")
          .or(keywords.map((k) => `contenu.ilike.%${k}%`).join(","))
          .limit(3);
        
        if (keywordError) console.error("[rag/query] Keyword search error:", keywordError);
        
        if (docs && docs.length > 0) {
          contextChunks = docs.map(d => ({
            titre: d.titre || d.source || "Document",
            contenu: d.contenu,
            source: d.source || d.titre
          }));
          usedRag = true;
        }
      }
    }
  }

  // Si toujours pas de contexte, on peut essayer une recherche floue sur le titre
  if (!usedRag) {
     const { data: docs } = await supabase
      .from("legal_documents")
      .select("titre, contenu, source")
      .ilike("titre", `%${question.split(' ')[0]}%`)
      .limit(2);
     if (docs && docs.length > 0) {
        contextChunks = docs;
        usedRag = true;
     }
  }

  const contextBlock =
    contextChunks.length > 0
      ? `\n\n--- SOURCES DOCUMENTAIRES IVOIRIENNES ---\n${contextChunks
          .map((c, i) => `[Source ${i + 1}] ${c.titre}\n${c.contenu}`)
          .join("\n\n")}\n--- FIN SOURCES ---`
      : "";

  const geminiHistory = (history || []).slice(-10).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const userMessage = {
    role: "user",
    parts: [{ text: contextBlock ? `${question}${contextBlock}` : question }]
  };

  try {
    const result = await gemini.models.generateContent({
      model: GEMINI_FLASH,
      contents: [...geminiHistory, userMessage], 
      config: { 
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1536,
        temperature: 0.2,
      },
    });

    const answer = result.candidates?.[0]?.content?.parts?.[0]?.text || result.text || "";

    return NextResponse.json({
      answer: answer || "Désolé, je n'ai pas pu générer de réponse précise pour le moment.",
      sources: contextChunks.map((c) => ({ titre: c.titre, source: c.source })),
      used_rag: usedRag,
    });
  } catch (err) {
    console.error("[rag/query] Gemini error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la réponse IA. Réessayez." },
      { status: 502 }
    );
  }
}
