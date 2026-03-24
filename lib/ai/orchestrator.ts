/**
 * Orchestrateur IA Multi-Agent — SaaS RH CI
 *
 * PRINCIPE : exécution parallèle (Promise.all) au lieu de séquentielle.
 * - Gemini Flash  → tâches rapides / peu coûteuses (extraction, structure)
 * - Claude Sonnet → raisonnement juridique, synthèse, scoring complexe
 * - n8n           → RAG pgvector, embeddings, webhooks
 *
 * RÈGLE : jamais d'IA côté client — ce fichier est serveur uniquement.
 */

import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { gemini, GEMINI_FLASH } from "@/lib/gemini";
import { triggerN8n } from "@/lib/n8n/webhooks";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CandidatAnalyseInput {
  cvTexte: string;
  posteId: string;
  posteTitre: string;
  posteCompetences: string;
  companyId: string;
}

export interface CandidatAnalyseResult {
  infosStructurees: InfosCVStructurees;
  scoreGlobal: number;
  recommandation: "shortlist" | "refus" | "en_attente";
  contexteJuridique: string;
  synthese: string;
  dureeMs: number;
}

export interface InfosCVStructurees {
  nom: string;
  email: string;
  telephone: string;
  competences: string[];
  annees_experience: number;
  formation: string;
  dernier_poste: string;
}

export interface ScoreCV {
  score_global: number;
  recommandation: "shortlist" | "refus" | "en_attente";
  points_forts: string[];
  points_faibles: string[];
}

// ─── Agent 1 : Gemini Flash — Extraction structurée du CV ─────────────────────

async function extraireInfosCV(cvTexte: string): Promise<InfosCVStructurees> {
  const prompt = `
Tu es un extracteur de données RH. Extrais les informations suivantes du CV ci-dessous.
Réponds UNIQUEMENT en JSON valide, sans texte autour.

CV :
${cvTexte}

Format attendu :
{
  "nom": "",
  "email": "",
  "telephone": "",
  "competences": [],
  "annees_experience": 0,
  "formation": "",
  "dernier_poste": ""
}
`;

  const response = await gemini.models.generateContent({
    model: GEMINI_FLASH,
    contents: prompt,
  });

  const texte = response.text ?? "";
  // Nettoyer les balises markdown si Gemini en ajoute
  const json = texte.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(json) as InfosCVStructurees;
}

// ─── Agent 2 : Claude Sonnet — Scoring CV selon le poste ──────────────────────

async function scorerCV(
  cvTexte: string,
  posteTitre: string,
  posteCompetences: string
): Promise<ScoreCV> {
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyse ce CV pour le poste : ${posteTitre}
Compétences requises : ${posteCompetences}
CV : ${cvTexte}

Réponds en JSON valide uniquement :
{
  "score_global": 0-100,
  "recommandation": "shortlist|refus|en_attente",
  "points_forts": [],
  "points_faibles": []
}`,
      },
    ],
  });

  const contenu = message.content[0];
  if (contenu.type !== "text") throw new Error("Réponse Claude inattendue");
  const json = contenu.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(json) as ScoreCV;
}

// ─── Agent 3 : n8n → pgvector — Contexte juridique ivoirien ──────────────────

async function obtenirContexteJuridique(
  question: string,
  companyId: string
): Promise<string> {
  const result = await triggerN8n("rag/query", { question, company_id: companyId });
  return (result as { reponse?: string }).reponse ?? "";
}

// ─── Orchestrateur principal : Analyse complète d'un candidat ────────────────

export async function analyserCandidat(
  input: CandidatAnalyseInput
): Promise<CandidatAnalyseResult> {
  const debut = Date.now();

  // ✅ PARALLÈLE — les 3 agents tournent simultanément
  const [infosStructurees, scoreCV, contexteJuridique] = await Promise.all([
    extraireInfosCV(input.cvTexte),
    scorerCV(input.cvTexte, input.posteTitre, input.posteCompetences),
    obtenirContexteJuridique(
      `Conditions d'embauche et période d'essai pour ${input.posteTitre} en Côte d'Ivoire`,
      input.companyId
    ),
  ]);

  // Synthèse finale par Claude (après récupération des résultats parallèles)
  const synthèseMsg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Tu es un expert RH ivoirien. Rédige une synthèse courte (3 phrases max) basée sur :
- Score CV : ${scoreCV.score_global}/100
- Recommandation : ${scoreCV.recommandation}
- Points forts : ${scoreCV.points_forts.join(", ")}
- Points faibles : ${scoreCV.points_faibles.join(", ")}
- Contexte juridique CI : ${contexteJuridique}

Réponds en français, de façon professionnelle et concise.`,
      },
    ],
  });

  const contenuSynthese = synthèseMsg.content[0];
  const synthese =
    contenuSynthese.type === "text" ? contenuSynthese.text : "";

  return {
    infosStructurees,
    scoreGlobal: scoreCV.score_global,
    recommandation: scoreCV.recommandation,
    contexteJuridique,
    synthese,
    dureeMs: Date.now() - debut,
  };
}

// ─── Orchestrateur : Réponse assistant RH (RAG + Gemini context) ─────────────

export interface AssistantRHInput {
  question: string;
  companyId: string;
}

export interface AssistantRHResult {
  reponse: string;
  sources: string[];
  dureeMs: number;
}

export async function questionnerAssistantRH(
  input: AssistantRHInput
): Promise<AssistantRHResult> {
  const debut = Date.now();

  // RAG via n8n (embeddings pgvector) en parallèle avec reformulation Gemini
  const [ragResult, questionReformulée] = await Promise.all([
    triggerN8n("rag/query", {
      question: input.question,
      company_id: input.companyId,
    }),
    gemini.models.generateContent({
      model: GEMINI_FLASH,
      contents: `Reformule cette question RH de façon plus précise pour une recherche juridique CI : "${input.question}"`,
    }),
  ]);

  const rag = ragResult as { reponse?: string; sources?: string[] };

  return {
    reponse: rag.reponse ?? "Aucune réponse trouvée.",
    sources: rag.sources ?? [],
    dureeMs: Date.now() - debut,
  };
}
