/**
 * lib/conges-ci.ts
 * Logique de calcul des congés annuels — règle métier client
 *
 * RÈGLE MÉTIER :
 *   - 30 jours de congé par an
 *   - Acquisition : 2,75 jours par mois à compter de la date d'embauche
 *   - Plafond annuel = 30 jours (atteint avant la fin de l'année car
 *     2,75 × 12 = 33 → plafonné à 30)
 *
 *   - Art. 26 CT-CI — majorations d'ancienneté (jours supplémentaires) :
 *       + 1 jour  après  5 ans d'ancienneté
 *       + 2 jours après 10 ans
 *       + 3 jours après 15 ans
 *       + 5 jours après 20 ans
 *       + 7 jours après 25 ans
 *     Ces jours majorateurs s'ajoutent au plafond annuel (30 + bonus).
 *
 *   - Allocation / ICCP :
 *       (moyenne des max. 12 derniers bruts) / 30 × nb jours pris
 *
 *   - CCI AINSI-UGTCI Art. 69 : congés événements familiaux gérés
 *     dans paie-ci.ts.
 *
 * ⚠️ Vérifier annuellement si la convention d'entreprise change.
 * Dernière mise à jour : mai 2026
 */

// Taux d'acquisition : 2,75 jours par mois (règle client)
export const TAUX_CONGES_PAR_MOIS = 2.75;

// Plafond annuel de base = 30 jours (règle client)
export const PLAFOND_CONGES_BASE = 30;

export interface SoldeConges {
  jours_acquis: number;
  jours_pris: number;
  solde: number;
  annee: number;
}

/**
 * Bonus d'ancienneté sur congés — Art. 26 CT-CI
 * Retourne les jours supplémentaires à ajouter en fonction des années d'ancienneté.
 *
 * @param annees - Nombre d'années d'ancienneté complètes
 * @returns Jours supplémentaires de congé (0, 1, 2, 3, 5 ou 7)
 */
export function bonusCongesAnciennete(annees: number): number {
  if (annees >= 25) return 7;
  if (annees >= 20) return 5;
  if (annees >= 15) return 3;
  if (annees >= 10) return 2;
  if (annees >= 5)  return 1;
  return 0;
}

/**
 * Calcule le nombre de jours de congés acquis pour une année donnée,
 * en respectant l'Art. 25.1 CT-CI (2,2 j/mois) et les majorations Art. 26 CT-CI.
 *
 * Un mois est considéré complet si l'employé était présent le 1er du mois.
 *
 * @param dateEmbauche  - Date d'embauche au format ISO (YYYY-MM-DD)
 * @param annee         - Année civile pour laquelle calculer les droits
 * @param ancienneteAns - Années d'ancienneté complètes (pour bonus Art. 26, défaut 0)
 * @returns Nombre de jours ouvrables acquis (base + bonus ancienneté)
 */
export function calculerJoursAcquis(
  dateEmbauche: string | null | undefined,
  annee: number,
  ancienneteAns = 0,
): number {
  if (!dateEmbauche) return 0;
  const parts = dateEmbauche.split('-');
  if (parts.length < 3) return 0;
  
  const anneeEmbauche = parseInt(parts[0], 10);
  const moisEmbauche  = parseInt(parts[1], 10); // 1-12
  const jourEmbauche  = parseInt(parts[2], 10);
  
  if (isNaN(anneeEmbauche) || isNaN(moisEmbauche) || isNaN(jourEmbauche)) return 0;

  let moisComplets = 0;

  for (let mois = 1; mois <= 12; mois++) {
    if (estPresentLe1erDuMois(anneeEmbauche, moisEmbauche, jourEmbauche, annee, mois)) {
      moisComplets++;
    }
  }

  // Acquisition : 2,2 j ouvrables × mois complets
  const joursBase = moisComplets * TAUX_CONGES_PAR_MOIS;

  // Prorata du bonus ancienneté selon les mois travaillés dans l'année
  // Le bonus annuel s'applique prorata si l'employé n'a pas fait toute l'année
  const bonusAnnuel = bonusCongesAnciennete(ancienneteAns);
  const bonusProrata = moisComplets >= 12
    ? bonusAnnuel
    : parseFloat((bonusAnnuel * (moisComplets / 12)).toFixed(2));

  // Plafond = plafond de base (26,4) + bonus ancienneté
  const plafond = PLAFOND_CONGES_BASE + bonusAnnuel;

  return parseFloat(Math.min(joursBase + bonusProrata, plafond).toFixed(2));
}

/**
 * Vérifie si l'employé était présent le 1er d'un mois donné.
 * L'employé est présent le 1er si sa date d'embauche est antérieure ou égale au 1er du mois.
 */
function estPresentLe1erDuMois(
  anneeEmbauche: number,
  moisEmbauche: number,
  jourEmbauche: number,
  annee: number,
  mois: number,
): boolean {
  if (anneeEmbauche < annee) return true;  // Embauché avant l'année cible
  if (anneeEmbauche > annee) return false; // Pas encore en poste
  // Même année
  if (moisEmbauche < mois) return true;    // Embauché dans un mois antérieur
  if (moisEmbauche > mois) return false;   // Pas encore en poste
  // Même mois : présent le 1er uniquement si embauché le 1er
  return jourEmbauche === 1;
}

/**
 * Calcule le solde de congés restant (jamais négatif).
 *
 * @param joursAcquis - Jours de congés acquis
 * @param jours_pris  - Jours déjà pris (congés approuvés)
 * @returns Solde restant (≥ 0)
 */
export function calculerSoldeConges(joursAcquis: number, jours_pris: number): number {
  return Math.max(0, joursAcquis - jours_pris);
}

/**
 * Allocation de congés payés (et indemnité compensatrice ICCP en cas
 * de départ) — règle métier client :
 *
 *   allocation = ( moyenne des max. 12 derniers bruts ) / 30 × jours pris
 *
 * Le diviseur 30 correspond au nombre de jours du mois (calcul calendaire),
 * cohérent avec l'acquisition de 30 jours par an.
 *
 * @param brutMoyen12Mois  - Moyenne des bruts perçus sur les 12 derniers mois
 *                            (ou moins si l'employé a moins d'ancienneté)
 * @param joursPris        - Nombre de jours de congé pris (ou restants pour ICCP)
 * @returns Allocation en FCFA arrondis
 */
export function calculerAllocationConges(
  brutMoyen12Mois: number,
  joursPris: number
): number {
  if (joursPris <= 0 || brutMoyen12Mois <= 0) return 0;
  return Math.round((brutMoyen12Mois / 30) * joursPris);
}

/**
 * Calcule la moyenne des bruts sur la fenêtre roulante des 12 derniers
 * bulletins (ou moins si l'employé a moins d'ancienneté).
 *
 * @param brutsDerniersMois - Tableau des bruts du plus récent au plus ancien
 *                            (ou inverse — l'ordre est sans importance)
 * @returns Moyenne arrondie en FCFA
 */
export function calculerBrutMoyen12Mois(brutsDerniersMois: number[]): number {
  if (!brutsDerniersMois || brutsDerniersMois.length === 0) return 0;
  const fenetre = brutsDerniersMois.slice(0, 12).filter((n) => Number.isFinite(n) && n >= 0);
  if (fenetre.length === 0) return 0;
  const somme = fenetre.reduce((s, n) => s + n, 0);
  return Math.round(somme / fenetre.length);
}

/**
 * Indemnité Compensatrice de Congés Payés (ICCP) au solde de tout compte.
 * Identique à `calculerAllocationConges` — gardé pour rétro-compatibilité
 * de l'API.
 *
 * Deux signatures supportées :
 *   - Nouvelle (recommandée) : (brutMoyen12Mois, joursRestants)
 *   - Ancienne (legacy)      : (joursRestants, salaireMensuelBrut)
 *     → détecté quand le 1er argument est ≤ 365 et le 2ᵉ > 365
 *     → applique la même formule /30 (et non plus /26)
 *
 * @returns FCFA arrondis
 */
export function calculerICCP(a: number, b: number): number {
  // Détection ancien ordre d'arguments (jours, salaire) : jours < salaire
  // et jours typiquement ≤ ~365.
  const looksLikeLegacy = a >= 0 && a <= 365 && b > a * 10;
  const brutMoyen = looksLikeLegacy ? b : a;
  const jours = looksLikeLegacy ? a : b;
  return calculerAllocationConges(brutMoyen, jours);
}
