/**
 * DUERP — Document Unique d'Évaluation des Risques Professionnels.
 * Référentiel des catégories légales et calcul de criticité.
 */

export const DUERP_CATEGORIES = [
  { value: "physique",     label: "Risques physiques",      description: "Bruit, vibrations, températures, rayonnements, manutention" },
  { value: "chimique",     label: "Risques chimiques",      description: "Produits dangereux, vapeurs, poussières, solvants" },
  { value: "biologique",   label: "Risques biologiques",    description: "Bactéries, virus, champignons, parasites" },
  { value: "psychosocial", label: "Risques psychosociaux",  description: "Stress, harcèlement, charge mentale, violence" },
  { value: "ergonomique",  label: "Risques ergonomiques",   description: "Postures, gestes répétitifs, écrans, charge physique" },
  { value: "electrique",   label: "Risques électriques",    description: "Contacts directs/indirects, arcs, électrocution" },
  { value: "incendie",     label: "Risques incendie",       description: "Sources d'ignition, matières combustibles, évacuation" },
  { value: "routier",      label: "Risques routiers",       description: "Déplacements professionnels, état véhicules, trajets" },
  { value: "chute",        label: "Risques de chute",       description: "Hauteur, glissade, escaliers, trébuchement" },
  { value: "machine",      label: "Risques machines",       description: "Pièces mobiles, outils tranchants, projection" },
] as const;

export const GRAVITE_LABELS: Record<number, { label: string; description: string }> = {
  1: { label: "Mineur",      description: "Soins légers, pas d'arrêt" },
  2: { label: "Modéré",      description: "Arrêt court (≤ 3 jours)" },
  3: { label: "Grave",       description: "Arrêt prolongé, séquelles possibles" },
  4: { label: "Très grave",  description: "Invalidité permanente ou décès" },
};

export const PROBABILITE_LABELS: Record<number, { label: string; description: string }> = {
  1: { label: "Improbable",         description: "Pourrait survenir exceptionnellement" },
  2: { label: "Occasionnelle",      description: "Possible quelques fois par an" },
  3: { label: "Fréquente",          description: "Plusieurs fois par mois" },
  4: { label: "Quasi-permanente",   description: "Au quotidien" },
};

export type DuerpSeverity = "faible" | "moyenne" | "elevee" | "critique";

export function severityFromCriticity(criticite: number): DuerpSeverity {
  if (criticite >= 12) return "critique";
  if (criticite >= 8) return "elevee";
  if (criticite >= 4) return "moyenne";
  return "faible";
}

export const SEVERITY_STYLES: Record<DuerpSeverity, { label: string; tone: string; bgBar: string }> = {
  faible:   { label: "Faible",   tone: "bg-emerald-50 text-emerald-700 border-emerald-200", bgBar: "bg-emerald-500" },
  moyenne:  { label: "Moyenne",  tone: "bg-sky-50 text-sky-700 border-sky-200",             bgBar: "bg-sky-500" },
  elevee:   { label: "Élevée",   tone: "bg-amber-50 text-amber-700 border-amber-200",       bgBar: "bg-amber-500" },
  critique: { label: "Critique", tone: "bg-rose-50 text-rose-700 border-rose-200",          bgBar: "bg-rose-500" },
};

export const STATUS_LABELS: Record<string, string> = {
  identifie: "Identifié",
  en_traitement: "En traitement",
  maitrise: "Maîtrisé",
  reevalue: "Réévalué",
};
