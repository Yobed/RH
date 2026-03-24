/**
 * Calcul bulletin de paie — Droit ivoirien
 * Sources :
 *   - Code du Travail CI (Loi n°2015-532 du 20 juillet 2015, mis à jour 2025)
 *   - Convention Collective Interprofessionnelle AICI-UGTCI
 *   - Décret n°2022-986 (SMIG 75 000 FCFA au 01/01/2023)
 *
 * ⚠️  VÉRIFICATION ANNUELLE OBLIGATOIRE
 * - SMIG       : peut être révisé par décret ministériel
 * - Tranches ITS : peuvent être modifiées par la Loi de Finances annuelle
 * - Taux CNPS  : à confirmer auprès de la CNPS CI (non publiés dans le CT-CI 2025)
 *
 * Dernière mise à jour : mars 2026 — SMIG 75 000 FCFA (Décret n°2022-986)
 */

// SMIG mensuel en vigueur depuis le 01/01/2023
// Source : Décret n°2022-986 du Ministère de l'Emploi CI
export const SMIG_MENSUEL = 75_000;

// CNPS part salariale : taux non publiés dans le CT-CI 2025
// Valeurs indicatives (à confirmer auprès de la CNPS CI) :
// Retraite 3.2% + Prévoyance 1.2% = 4.4% total salarié
// ⚠️ Ces taux ne figurent pas explicitement dans les textes fournis
export const TAUX_CNPS_SALARIE = 0.044;

// Plafond mensuel CNPS : non spécifié dans les textes fournis
// Valeur indicative basée sur 45 × SMIG = 45 × 75 000 = 3 375 000 FCFA
// ⚠️ À confirmer auprès de la CNPS CI
export const PLAFOND_CNPS = 45 * SMIG_MENSUEL; // 3 375 000 FCFA

/**
 * Calcul ITS (Impôt sur Traitement et Salaires) — Barème CI simplifié mensuel
 * Base imposable = brut - CNPS salarié - abattement forfaitaire
 * ⚠️ Barème ITS non détaillé dans le CT-CI 2025 (seule l'obligation de retenue est mentionnée)
 * Barème ci-dessous = barème CGI CI Art. 116 — À vérifier chaque Loi de Finances
 */
export function calculerITS(salaireImposable: number): number {
  if (salaireImposable <= 0) return 0;

  // Barème mensuel progressif ITS CI (Art. 116 CGI CI)
  // Tranches mensuelles = tranches annuelles ÷ 12
  // ⚠️ À vérifier avec la Loi de Finances de l'année en cours
  const tranches = [
    { limite: 75_000, taux: 0 },
    { limite: 200_000, taux: 0.12 },
    { limite: 350_000, taux: 0.18 },
    { limite: 600_000, taux: 0.25 },
    { limite: Infinity, taux: 0.32 },
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
  const baseCNPS = Math.min(salaireBrut, PLAFOND_CNPS);
  const cnps_salarie = Math.round(baseCNPS * TAUX_CNPS_SALARIE);

  // Base imposable ITS = brut - CNPS - abattement forfaitaire (CGI CI)
  // ⚠️ Taux abattement à confirmer avec Loi de Finances en vigueur
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

// ── Indemnité de licenciement — Art. 74 CT-CI ───────────────────────────
// Source : Décret n°96-201 du 7 mars 1996 / CCI Art. 39
// Base = salaire global mensuel moyen des 12 derniers mois (pas le salaire actuel)
// Tranches : 30% (1–5 ans) · 35% (6–10 ans) · 40% (11 ans et +)
// Plafond : pas de plafond pour le licenciement (départ retraite : 25 × SMIG annuel)
export function calculerIndemniteLicenciement(salaireMoyen12Mois: number, annees: number): number {
  let indemnite = 0;
  const anneesEntiere = Math.floor(annees);

  for (let a = 1; a <= anneesEntiere; a++) {
    const taux = a <= 5 ? 0.30 : a <= 10 ? 0.35 : 0.40;
    indemnite += salaireMoyen12Mois * taux;
  }

  // Fraction d'année résiduelle
  const fraction = annees - anneesEntiere;
  if (fraction > 0) {
    const taux = anneesEntiere < 5 ? 0.30 : anneesEntiere < 10 ? 0.35 : 0.40;
    indemnite += salaireMoyen12Mois * taux * fraction;
  }

  return Math.round(indemnite);
}

// ── Majorations heures supplémentaires — Décret n°96-203 ───────────────
// Source : Décret n°96-203 du 7 mars 1996
export const MAJORATIONS_HEURES_SUP = {
  semaine_41_46: 0.15,   // 41e à 46e heure en semaine
  semaine_au_dela_46: 0.50, // Au-delà de la 46e heure en semaine
  dimanche: 0.75,        // Dimanche
  jour_ferie: 0.75,      // Jours fériés
  nuit: 0.75,            // Nuit (21h–5h)
  // Samedi : non spécifié dans les textes — à vérifier avec convention collective
} as const;

// ── Préavis CDI — Décret n°96-200 / CCI Art. 34 ───────────────────────
// Ouvriers/employés : 8 jours minimum — 4 mois maximum
// Agents de maîtrise (cat. 6+) : 3 mois minimum — 4 mois maximum
// Cadres : 3 mois minimum — 4 mois maximum
export const PREAVIS_CDI = {
  ouvrier_employe: { min_jours: 8, max_mois: 4 },
  agent_maitrise: { min_mois: 3, max_mois: 4 },
  cadre: { min_mois: 3, max_mois: 4 },
} as const;

// ── Congés événements familiaux — CCI Art. 69 / Ordonnance 2021-902 ────
// Limite totale : 10 jours ouvrables par an
export const CONGES_FAMILIAUX = [
  { type: "Mariage du salarié", jours: 4 },
  { type: "Mariage d'un enfant", jours: 2 },
  { type: "Mariage d'un frère ou d'une sœur", jours: 2 },
  { type: "Décès du conjoint", jours: 5 },
  { type: "Décès d'un enfant", jours: 5 },
  { type: "Décès du père ou de la mère", jours: 5 },
  { type: "Décès d'un frère ou d'une sœur", jours: 2 },
  { type: "Décès du beau-père ou de la belle-mère", jours: 2 },
  { type: "Naissance d'un enfant", jours: 2 },
  { type: "Baptême ou première communion d'un enfant", jours: 1 },
  { type: "Déménagement", jours: 1 },
] as const;
