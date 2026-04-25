import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { gemini, GEMINI_FLASH } from "@/lib/gemini";

export const dynamic = 'force-dynamic';

const evaluationSchema = z.object({
  employee_id: z.string().uuid("Employé obligatoire"),
  titre: z.string().min(1, "Titre obligatoire").max(100),
  type: z.enum(["ANNUELLE", "SEMESTRIELLE", "TRIMESTRIELLE", "MENSUELLE", "PERIODE_ESSAI", "AUTRE"]),
  statut: z.enum(["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]).default("PLANIFIEE"),
  date_prevue: z.string().min(1, "Date obligatoire"),
  periode: z.string().optional(), // Facultatif — dérivé automatiquement si absent
  date_realisation: z.string().optional().nullable(),
  score_global: z.coerce.number().int().min(0).max(100).nullable().optional(),
  criteres_evaluation: z
    .object({
      technique: z.coerce.number().int().min(0).max(100).optional(),
      comportement: z.coerce.number().int().min(0).max(100).optional(),
      ponctualite: z.coerce.number().int().min(0).max(100).optional(),
      initiative: z.coerce.number().int().min(0).max(100).optional(),
    })
    .optional()
    .default({}),
  commentaires_evaluateur: z.string().optional().nullable(),
  commentaires_employe: z.string().optional().nullable(),
  objectifs_futurs: z.string().optional().nullable(),
});

/**
 * Génère automatiquement la valeur de `periode` à partir du type et de la date
 * Exemples : "2026", "S1-2026", "T1-2026", "Avril 2026", "Essai-2026"
 */
function deriverPeriode(type: string, datePrevue: string): string {
  // Parsing strict sans décalage UTC
  const [y, m, dstr] = datePrevue.split("-");
  const year = parseInt(y, 10) || new Date().getFullYear();
  const month = parseInt(m, 10) || new Date().getMonth() + 1;
  const day = parseInt(dstr, 10) || 1;
  
  const dLocal = new Date(year, month - 1, day);

  switch (type.toUpperCase()) {
    case "ANNUELLE":
      return String(year);
    case "SEMESTRIELLE":
      return month <= 6 ? `S1-${year}` : `S2-${year}`;
    case "TRIMESTRIELLE":
      if (month <= 3) return `T1-${year}`;
      if (month <= 6) return `T2-${year}`;
      if (month <= 9) return `T3-${year}`;
      return `T4-${year}`;
    case "MENSUELLE":
      return dLocal.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    case "PERIODE_ESSAI":
      return `Essai-${year}`;
    default:
      return String(year);
  }
}

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
      config: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    return res.text?.trim() ?? null;
  } catch (err) {
    console.error("[GEMINI_EVAL_ERROR]", err);
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
  const criteres = parsed.data.criteres_evaluation ?? {};
  const vals = Object.values(criteres).filter((v): v is number => v !== undefined);
  if (vals.length > 0 && scoreGlobal === null) {
    scoreGlobal = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  // ✅ PARALLÈLE — Gemini synthèse + profil évaluateur + potentiel simultanément
  const [synthese, profileResult, potentialScore] = await Promise.all([
    scoreGlobal !== null
      ? genererSyntheseGemini(criteres, scoreGlobal)
      : Promise.resolve(null),
    supabase.from("profiles").select("id").eq("id", user.id).single(),
    scoreGlobal !== null
      ? (async () => {
          const { data: prev } = await supabase
            .from("evaluations")
            .select("score_global")
            .eq("employee_id", parsed.data.employee_id)
            .in("statut", ["TERMINEE", "REALISEE"])
            .order("date_realisation", { ascending: false })
            .limit(3);
            
          if (!prev || prev.length === 0) {
            return scoreGlobal >= 80 ? Math.min(95, scoreGlobal + 10) : Math.min(100, Math.max(0, scoreGlobal - 5));
          }
          const scores = prev.map((p: any) => p.score_global).filter((s: any) => s !== null) as number[];
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          const trend = scoreGlobal > avg ? 1.15 : 0.85;
          return Math.min(100, Math.max(0, Math.round(((avg + scoreGlobal) / 2) * trend)));
        })()
      : Promise.resolve(null),
  ]);

  const { data: profile } = profileResult;

  // Dériver automatiquement la période si non fournie
  const periode = parsed.data.periode?.trim() ||
    deriverPeriode(parsed.data.type, parsed.data.date_prevue);

  const { data, error } = await supabase
    .from("evaluations")
    .insert({
      employee_id: parsed.data.employee_id,
      titre: parsed.data.titre,
      type: parsed.data.type,
      periode,
      statut: parsed.data.statut,
      date_prevue: parsed.data.date_prevue,
      date_realisation: parsed.data.date_realisation ?? (parsed.data.statut === 'TERMINEE' ? new Date().toISOString() : null),
      score_global: scoreGlobal,
      potential_score: potentialScore,
      criteres_evaluation: criteres,
      commentaires_evaluateur: parsed.data.commentaires_evaluateur ?? null,
      commentaires_employe: parsed.data.commentaires_employe ?? null,
      objectifs_futurs: parsed.data.objectifs_futurs ?? null,
      company_id: companyId as string,
      evaluateur_id: profile?.id ?? null,
      synthese_ia: synthese,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(
    {
      ...data,
      synthese_ia: synthese, 
    },
    { status: 201 }
  );
}

export async function PATCH(req: Request) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "ID de l'évaluation manquant" }, { status: 400 });
  }

  // Vérifier l'appartenance à l'entreprise (via audit/RLS ou vérification manuelle)
  const { data: companyId } = await supabase.rpc("get_user_company_id");
  
  const { data, error } = await supabase
    .from("evaluations")
    .update(updates)
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

