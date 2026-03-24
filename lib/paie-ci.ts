/**
 * Calcul bulletin de paie — Droit ivoirien
 * Références : Code du Travail CI (Loi 2015-532), Décret CNPS, CGI CI
 *
 * ⚠️  VÉRIFICATION ANNUELLE OBLIGATOIRE
 * - PLAFOND_CNPS : basé sur 45 × SMIG. À mettre à jour si le SMIG est révisé par décret.
 * - Tranches ITS  : peuvent être modifiées par la Loi de Finances annuelle.
 * Dernière vérification : mars 2026 — SMIG 36 607 FCFA (Décret 2013)
 */

// CNPS part salariale : 3.2% retraite + 1.2% prévoyance = 4.4%
// Plafond mensuel CNPS : 45 × SMIG (36 607 FCFA) = 1 647 315 FCFA
// Source : Décret n°2012-894 du 26 septembre 2012
export const TAUX_CNPS_SALARIE = 0.044;
export const PLAFOND_CNPS = 1_647_315; // ⚠️ À vérifier si SMIG révisé

/**
 * Calcul ITS (Impôt sur Traitement et Salaires) — Barème CI simplifié mensuel
 * Base imposable = brut - CNPS - abattement 15% (minimum charges prof.)
 */
export function calculerITS(salaireImposable: number): number {
  if (salaireImposable <= 0) return 0;

  // Barème mensuel progressif ITS CI (Art. 116 CGI CI)
  // ⚠️ Tranches mensuelles = tranches annuelles ÷ 12 — À vérifier chaque Loi de Finances
  // Source : CGI CI (base annuelle) : 0→900K : 0% | 900K→2,4M : 12% | 2,4M→4,2M : 18% | 4,2M→7,2M : 25% | >7,2M : 32%
  const tranches = [
    { limite: 75_000, taux: 0 },      // 0 → 900 000 / an
    { limite: 200_000, taux: 0.12 },  // 900 001 → 2 400 000 / an
    { limite: 350_000, taux: 0.18 },  // 2 400 001 → 4 200 000 / an
    { limite: 600_000, taux: 0.25 },  // 4 200 001 → 7 200 000 / an
    { limite: Infinity, taux: 0.32 }, // > 7 200 000 / an
  ];

  let its = 0;
  let reste = salaireImposable;
  let precedente = 0;

  for (const tranche of tranches) {
    if (reste <= 0) break;
    const base = Math.min(reste, tranche.limite - precedente);
    its += base * tranche.taux;
    reste -= base;
    precedente = tranche.limite;
  }

  return Math.round(its);
}

export interface ResultatPaie {
  salaire_brut: number;
  cnps_salarie: number;
  base_imposable: number;
  its: number;
  salaire_net_avant_retenues: number;
  salaire_net: number;
}

export function calculerBulletin(
  salaireBrut: number,
  autresRetenues = 0,
  avances = 0
): ResultatPaie {
  const basesCNPS = Math.min(salaireBrut, PLAFOND_CNPS);
  const cnps_salarie = Math.round(basesCNPS * TAUX_CNPS_SALARIE);

  // Base imposable ITS = brut - CNPS - 15% abattement forfaitaire
  const abattement = Math.round(salaireBrut * 0.15);
  const base_imposable = Math.max(0, salaireBrut - cnps_salarie - abattement);
  const its = calculerITS(base_imposable);

  const salaire_net_avant_retenues = salaireBrut - cnps_salarie - its;
  const salaire_net = salaire_net_avant_retenues - autresRetenues - avances;

  return {
    salaire_brut: salaireBrut,
    cnps_salarie,
    base_imposable,
    its,
    salaire_net_avant_retenues,
    salaire_net: Math.max(0, salaire_net),
  };
}
