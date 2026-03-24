import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { gemini, GEMINI_FLASH } from "@/lib/gemini";

const evaluationSchema = z.object({
  employee_id: z.string().uuid("Employé obligatoire"),
  periodicite: z.enum(["mensuel", "trimestriel", "semestriel", "annuel"]),
  periode: z.string().min(1, "Période obligatoire").max(50),
  date_evaluation: z.string().min(1, "Date obligatoire"),
  score_global: z.coerce.number().int().min(0).max(100).nullable().optional(),
  scores: z
    .object({
      technique: z.coerce.number().int().min(0).max(100).optional(),
      comportement: z.coerce.number().int().min(0).max(100).optional(),
      ponctualite: z.coerce.number().int().min(0).max(100).optional(),
      initiative: z.coerce.number().int().min(0).max(100).optional(),
    })
    .optional()
    .default({}),
  statut: z.enum(["brouillon", "validé"]).default("brouillon"),
});

/**
 * Génère une synthèse textuelle automatique via Gemini Flash
 * Non bloquant — en cas d'échec, la synthèse est null
 */
async function genererSyntheseGemini(
  scores: Record<string, number | undefined>,
  scoreGlobal: number
): Promise<string | null> {
  const scoresList = Object.entries(scores)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${v}/100`)
    .join(", ");

  if (!scoresList) return null;

  try {
    const res = await gemini.models.generateContent({
      model: GEMINI_FLASH,
      contents: `Tu es un expert RH. Génère une synthèse d'évaluation professionnelle (3 phrases max, ton neutre et constructif) à partir de ces scores :
Score global : ${scoreGlobal}/100
Détail : ${scoresList}

Inclus : appréciation globale, axe de progrès principal, mot d'encouragement.`,
    });
    return res.text?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = evaluationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: companyId, error: companyError } = await supabase.rpc("get_user_company_id");
  if (companyError || !companyId) {
    return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });
  }

  // Calculer le score global automatiquement si des sous-scores sont fournis
  let scoreGlobal = parsed.data.score_global ?? null;
  const scores = parsed.data.scores ?? {};
  const vals = Object.values(scores).filter((v): v is number => v !== undefined);
  if (vals.length > 0 && scoreGlobal === null) {
    scoreGlobal = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  // ✅ PARALLÈLE — Gemini synthèse + profil évaluateur simultanément
  const [synthese, profileResult] = await Promise.all([
    scoreGlobal !== null
      ? genererSyntheseGemini(scores, scoreGlobal)
      : Promise.resolve(null),
    supabase.from("profiles").select("id").eq("id", user.id).single(),
  ]);

  const { data: profile } = profileResult;

  const { data, error } = await supabase
    .from("evaluations")
    .insert({
      employee_id: parsed.data.employee_id,
      periodicite: parsed.data.periodicite,
      periode: parsed.data.periode,
      date_evaluation: parsed.data.date_evaluation,
      score_global: scoreGlobal,
      scores: scores,
      statut: parsed.data.statut,
      company_id: companyId as string,
      evaluateur_id: profile?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      ...data,
      synthese_ia: synthese, // Synthèse générée par Gemini Flash (peut être null)
    },
    { status: 201 }
  );
}
