/**
 * Calculs FDFP (Fonds de Développement de la Formation Professionnelle CI).
 *
 * Cotisations (sur salaire brut, sans plafond) :
 *   - 1,2 % FDFP — récupérable en crédit formation
 *   - 0,4 % Taxe d'apprentissage — récupérable en formation alternance
 *
 * Le FDFP rembourse jusqu'à un certain plafond les actions de formation
 * dûment dossierisées.
 */

export const FDFP_RATE = 0.012;
export const APPRENTISSAGE_RATE = 0.004;

/**
 * Calcule le crédit FDFP cumulé sur une période à partir d'un montant
 * total de masse salariale brute.
 */
export function computeFdfpCredit(masseSalarialeBrute: number): {
  fdfp: number;
  apprentissage: number;
  total: number;
} {
  const fdfp = Math.round(masseSalarialeBrute * FDFP_RATE);
  const apprentissage = Math.round(masseSalarialeBrute * APPRENTISSAGE_RATE);
  return {
    fdfp,
    apprentissage,
    total: fdfp + apprentissage,
  };
}

/**
 * Calcule le taux d'effort formation : coût formation / masse salariale.
 * Cible légale recommandée : ≥ 1 % pour un plan robuste.
 */
export function computeTrainingEffort(
  totalCoutFormation: number,
  masseSalarialeBrute: number
): number {
  if (masseSalarialeBrute <= 0) return 0;
  return Math.round((totalCoutFormation / masseSalarialeBrute) * 1000) / 10;
}
