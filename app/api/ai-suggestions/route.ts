import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/claude";
import { createServerClient } from "@/lib/supabase/server";

interface SuggestionsBody {
  totalActifs: number;
  cddExpirant: number;
  medicalAlertsCount: number;
  evalBrouillon: number;
  contentieuxOuverts: number;
  congesEnAttente: number;
}

interface Suggestion {
  id: string;
  priorite: "haute" | "moyenne" | "basse";
  emoji: string;
  titre: string;
  action: string;
  href: string;
}

interface SuggestionsResponse {
  suggestions: Suggestion[];
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body: SuggestionsBody = await req.json();

  // IA gratuite (Gemini via l'adaptateur). Si la clé manque ou que l'IA échoue,
  // on dégrade proprement vers une liste vide — le widget dashboard ne casse jamais.
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const message = await anthropic.messages.create({
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Tu es un assistant RH expert en droit du travail ivoirien.
Voici les statistiques RH actuelles :
- Effectif actif : ${body.totalActifs}
- CDD expirant sous 30j : ${body.cddExpirant}
- Alertes médicales : ${body.medicalAlertsCount}
- Évaluations en brouillon : ${body.evalBrouillon}
- Contentieux ouverts : ${body.contentieuxOuverts}
- Congés en attente validation : ${body.congesEnAttente}

Génère exactement 3 suggestions RH prioritaires et actionnables en JSON. Format strict :
{"suggestions":[{"id":"1","priorite":"haute|moyenne|basse","emoji":"🚨","titre":"...","action":"...","href":"/route"},...]}

Les href doivent pointer vers /contrats, /conges, /evaluations, /contentieux, /medical, /employes, /paie selon le sujet.`,
        },
      ],
    });

    const firstContent = message.content[0];
    const match = firstContent.text.match(/\{[\s\S]*\}/);
    const json: SuggestionsResponse = JSON.parse(
      match?.[0] ?? '{"suggestions":[]}'
    );

    return NextResponse.json(json);
  } catch (err) {
    console.error("ai-suggestions (Gemini) a échoué:", err);
    return NextResponse.json({ suggestions: [] });
  }
}
