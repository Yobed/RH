import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée" },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
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
  if (firstContent.type !== "text") {
    return NextResponse.json({ suggestions: [] });
  }

  const match = firstContent.text.match(/\{[\s\S]*\}/);
  const json: SuggestionsResponse = JSON.parse(
    match?.[0] ?? '{"suggestions":[]}'
  );

  return NextResponse.json(json);
}
