import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { gemini, GEMINI_FLASH } from "@/lib/gemini";

const requestSchema = z.object({
  candidate_id: z.string().uuid("ID candidat invalide"),
});

interface ScoreDetail {
  score_global: number;
  competences: number;
  experience: number;
  formation: number;
  adequation: number;
  recommandation: "shortlist" | "entretien" | "refus";
  justification: string;
  points_forts: string[];       // nouveau — extrait par Gemini Flash
  points_attention: string[];   // nouveau — extrait par Gemini Flash
}

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
    return NextResponse.json({ error: "ID candidat invalide" }, { status: 400 });
  }

  // Récupérer candidat + offre d'emploi
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select(
      `id, full_name, email, notes_rh, cv_url,
       job_postings(titre, description, competences, experience_min, type_contrat)`
    )
    .eq("id", parsed.data.candidate_id)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json({ error: "Candidat introuvable" }, { status: 404 });
  }

  const job = (candidate.job_postings as unknown) as {
    titre: string;
    description: string;
    competences: string[] | null;
    experience_min: number | null;
    type_contrat: string | null;
  } | null;

  if (!job) {
    return NextResponse.json(
      { error: "Ce candidat n'est lié à aucune offre d'emploi" },
      { status: 422 }
    );
  }

  const competencesList = job.competences?.join(", ") ?? "non précisées";
  const cvInfo = candidate.notes_rh
    ? `Notes RH : ${candidate.notes_rh}`
    : candidate.cv_url
    ? `CV disponible à : ${candidate.cv_url}`
    : "Aucune information supplémentaire";

  // ✅ PARALLÈLE — Gemini Flash extrait les points clés en même temps que la DB query
  const [geminiAnalyse] = await Promise.all([
    gemini.models.generateContent({
      model: GEMINI_FLASH,
      contents: `Analyse ce profil RH pour un recrutement en Côte d'Ivoire.
Candidat : ${candidate.full_name} | ${cvInfo}
Poste : ${job.titre} | Compétences : ${competencesList} | Expérience min : ${job.experience_min ?? 0} an(s)

Réponds en JSON strict :
{
  "points_forts": ["<max 3 points forts>"],
  "points_attention": ["<max 3 points à surveiller>"],
  "resume_profil": "<1 phrase>"
}`,
    }),
  ]);

  // Parser la réponse Gemini (fallback silencieux si erreur)
  let pointsForts: string[] = [];
  let pointsAttention: string[] = [];
  let resumeProfil = "";
  try {
    const geminiTexte = (geminiAnalyse.text ?? "")
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const geminiData = JSON.parse(geminiTexte) as {
      points_forts?: string[];
      points_attention?: string[];
      resume_profil?: string;
    };
    pointsForts = geminiData.points_forts ?? [];
    pointsAttention = geminiData.points_attention ?? [];
    resumeProfil = geminiData.resume_profil ?? "";
  } catch {
    // Gemini indisponible → on continue sans enrichissement
  }

  // Prompt Claude enrichi avec l'analyse Gemini
  const prompt = `Tu es un expert RH ivoirien. Évalue ce candidat pour l'offre d'emploi suivante.

OFFRE :
- Poste : ${job.titre}
- Type contrat : ${job.type_contrat ?? "Non précisé"}
- Expérience minimum : ${job.experience_min ?? 0} an(s)
- Compétences requises : ${competencesList}
- Description : ${job.description}

CANDIDAT :
- Nom : ${candidate.full_name}
- Email : ${candidate.email}
- ${cvInfo}
${resumeProfil ? `- Résumé profil : ${resumeProfil}` : ""}
${pointsForts.length > 0 ? `- Points forts identifiés : ${pointsForts.join(", ")}` : ""}
${pointsAttention.length > 0 ? `- Points d'attention : ${pointsAttention.join(", ")}` : ""}

CRITÈRES DE SCORING (total 100 points) :
- Compétences : 35 points
- Expérience : 30 points
- Formation : 20 points
- Adéquation culturelle / poste : 15 points

RÈGLES DE DÉCISION :
- Score >= 80 → recommandation = "shortlist"
- Score >= 60 → recommandation = "entretien"
- Score < 60 → recommandation = "refus"

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "score_global": <0-100>,
  "competences": <0-35>,
  "experience": <0-30>,
  "formation": <0-20>,
  "adequation": <0-15>,
  "recommandation": "shortlist" | "entretien" | "refus",
  "justification": "<2-3 phrases max>"
}`;

  let scoreDetail: ScoreDetail;
  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const claudeData = JSON.parse(text) as Omit<ScoreDetail, "points_forts" | "points_attention">;

    // Fusionner résultats Claude + Gemini
    scoreDetail = {
      ...claudeData,
      points_forts: pointsForts,
      points_attention: pointsAttention,
    };
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'analyse IA. Réessayez." },
      { status: 502 }
    );
  }

  const statutMap: Record<string, string> = {
    shortlist: "shortlist",
    entretien: "entretien",
    refus: "refus",
  };

  const { data: updated, error: updateError } = await supabase
    .from("candidates")
    .update({
      score_ia: scoreDetail.score_global,
      score_detail: scoreDetail as unknown as import("@/types/supabase").Json,
      statut: statutMap[scoreDetail.recommandation] ?? "en_cours",
    })
    .eq("id", parsed.data.candidate_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    candidate: updated,
    score: scoreDetail,
  });
}
