// ─────────────────────────────────────────────────────────────────────────
// Risque de départ (turnover) — barème documenté, source unique de vérité.
// Utilisé par la page /analytique/risque-depart et l'API analytics.
// ─────────────────────────────────────────────────────────────────────────

export type RiskLevel = "faible" | "modere" | "eleve" | "critique";

export const RISK_LEVEL_META: Record<
  RiskLevel,
  { label: string; min: number; tone: "success" | "warning" | "danger"; dot: string; badge: string; text: string }
> = {
  critique: { label: "Critique", min: 70, tone: "danger", dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50", text: "text-rose-600 dark:text-rose-400" },
  eleve: { label: "Élevé", min: 45, tone: "warning", dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-900/50", text: "text-orange-600 dark:text-orange-400" },
  modere: { label: "Modéré", min: 20, tone: "warning", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50", text: "text-amber-600 dark:text-amber-400" },
  faible: { label: "Faible", min: 0, tone: "success", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50", text: "text-emerald-600 dark:text-emerald-400" },
};

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "critique";
  if (score >= 45) return "eleve";
  if (score >= 20) return "modere";
  return "faible";
}

export type RiskFactorKey =
  | "anciennete"
  | "no_raise"
  | "low_eval"
  | "absences"
  | "cdd_expiring"
  | "litige"
  | "no_training";

export interface RiskFactorDef {
  key: RiskFactorKey;
  label: string;
  weight: number; // points ajoutés au score quand le facteur est déclenché
  category: "Engagement" | "Rémunération" | "Performance" | "Contrat" | "Climat";
  description: string; // ce que mesure le facteur (documentation)
  recommendation: string; // action RH recommandée
}

// Barème complet (max théorique = somme des poids, score plafonné à 100)
export const RISK_FACTORS: Record<RiskFactorKey, RiskFactorDef> = {
  litige: {
    key: "litige",
    label: "Contentieux ouvert",
    weight: 30,
    category: "Climat",
    description: "Dossier disciplinaire ou contentieux en cours impliquant le salarié.",
    recommendation: "Suivre le dossier avec le service juridique et désamorcer le conflit.",
  },
  cdd_expiring: {
    key: "cdd_expiring",
    label: "CDD expirant sous 60 jours",
    weight: 25,
    category: "Contrat",
    description: "Contrat à durée déterminée arrivant à échéance dans moins de 60 jours.",
    recommendation: "Décider du renouvellement ou de la transformation en CDI.",
  },
  no_raise: {
    key: "no_raise",
    label: "Aucune augmentation depuis 2+ ans",
    weight: 20,
    category: "Rémunération",
    description: "Stagnation salariale sur 2 ans ou plus (écart de salaire brut < 2 %).",
    recommendation: "Étudier une revalorisation ou organiser un entretien de rémunération.",
  },
  absences: {
    key: "absences",
    label: "Absences fréquentes (> 15 j/an)",
    weight: 20,
    category: "Engagement",
    description: "Plus de 15 jours d'absence approuvée sur les 12 derniers mois.",
    recommendation: "Échanger sur les causes (charge, santé, climat) lors d'un entretien.",
  },
  anciennete: {
    key: "anciennete",
    label: "Ancienneté < 1 an",
    weight: 15,
    category: "Engagement",
    description: "Les départs sont les plus fréquents durant la première année.",
    recommendation: "Renforcer l'onboarding et les points de suivi (30/60/90 jours).",
  },
  low_eval: {
    key: "low_eval",
    label: "Score d'évaluation faible (< 60/100)",
    weight: 15,
    category: "Performance",
    description: "Dernière évaluation validée inférieure à 60/100.",
    recommendation: "Mettre en place un plan d'accompagnement avec objectifs clairs.",
  },
  no_training: {
    key: "no_training",
    label: "Aucune formation depuis 1+ an",
    weight: 10,
    category: "Performance",
    description: "Absence d'investissement formation depuis plus d'un an.",
    recommendation: "Proposer une action de formation / montée en compétences.",
  },
};

// Ordre d'affichage du barème (par poids décroissant)
export const RISK_FACTORS_ORDERED: RiskFactorDef[] = Object.values(RISK_FACTORS).sort(
  (a, b) => b.weight - a.weight
);

export interface AppliedFactor {
  key: RiskFactorKey;
  label: string;
  points: number;
  detail?: string; // précision chiffrée (ex. "18 j/an")
  recommendation: string;
}

export interface RisqueDepartRow {
  employee_id: string;
  full_name: string;
  poste: string;
  departement: string;
  photo_url?: string | null;
  anciennete_ans: number;
  score: number;
  niveau: RiskLevel;
  facteurs: AppliedFactor[];
}

// Crée un facteur appliqué à partir du barème (garde les libellés/poids cohérents)
export function applyFactor(key: RiskFactorKey, detail?: string): AppliedFactor {
  const def = RISK_FACTORS[key];
  return { key, label: def.label, points: def.weight, detail, recommendation: def.recommendation };
}
