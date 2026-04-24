/**
 * lib/conges-ci.ts
 * Logique de calcul des congés annuels — Code du Travail de Côte d'Ivoire
 *
 * BASES LÉGALES :
 *   - Art. 25.1 CT-CI (Loi n°2015-532 du 20 juillet 2015) :
 *       2,2 jours ouvrables de congé par mois de travail effectif
 *       → plafond de base : 2,2 × 12 = 26,4 jours/an
 *
 *   - Art. 26 CT-CI (majorations d'ancienneté — jours ouvrables supplémentaires) :
 *       + 1 jour  après  5 ans d'ancienneté (≥ 5 < 10 ans)
 *       + 2 jours après 10 ans d'ancienneté (≥ 10 < 15 ans)
 *       + 3 jours après 15 ans d'ancienneté (≥ 15 < 20 ans)
 *       + 5 jours après 20 ans d'ancienneté (≥ 20 < 25 ans)
 *       + 7 jours après 25 ans d'ancienneté (≥ 25 ans)
 *     Ces jours majorateurs s'ajoutent au plafond annuel (26,4 + bonus).
 *
 *   - Convention Collective Interprofessionnelle AINSI-UGTCI (Art. 69) :
 *       Congés événements familiaux déjà gérés dans paie-ci.ts.
 *
 * ⚠️ Vérifier annuellement si des décrets ou avenants modifient ces taux.
 * Dernière mise à jour : mars 2026
 */

// Taux légal Art. 25.1 CT-CI : 2,2 jours ouvrables/mois de travail effectif
export const TAUX_CONGES_PAR_MOIS = 2.2;

// Plafond annuel de base (12 mois × 2,2 j) sans bonus ancienneté
export const PLAFOND_CONGES_BASE = 26.4; // = TAUX_CONGES_PAR_MOIS * 12

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
  dateEmbauche: string,
  annee: number,
  ancienneteAns = 0,
): number {
  const parts = dateEmbauche.split('-');
  const anneeEmbauche = parseInt(parts[0], 10);
  const moisEmbauche  = parseInt(parts[1], 10); // 1-12
  const jourEmbauche  = parseInt(parts[2], 10);

  let moisComplets = 0;

  for (let mois = 1; mois <= 12; mois++) {
    if (estPresentLe1erDuMois(anneeEmbauche, moisEmbauche, jourEmbauche, annee, mois)) {
      moisComplets++;
    }
  }

  // Art. 25.1 CT-CI : 2,2 j ouvrables × mois complets
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
 * Calcule l'Indemnité Compensatrice de Congés Payés (ICCP) au solde de tout compte.
 * Base légale : Art. 25.4 CT-CI + usage praticien CI.
 * Taux journalier = salaire mensuel brut / 26 jours ouvrables.
 *
 * @param joursRestants        - Jours de congés non pris
 * @param salaireMensuelBrut   - Salaire mensuel brut actuel
 * @returns Indemnité compensatrice (FCFA arrondis)
 */
export function calculerICCP(joursRestants: number, salaireMensuelBrut: number): number {
  if (joursRestants <= 0 || salaireMensuelBrut <= 0) return 0;
  // Taux journalier sur 26 jours ouvrables (base praticien CI)
  const tauxJournalier = salaireMensuelBrut / 26;
  return Math.round(tauxJournalier * joursRestants);
}
