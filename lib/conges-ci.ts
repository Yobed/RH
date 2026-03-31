/**
 * lib/conges-ci.ts
 * Logique de calcul des congés selon le droit ivoirien
 * Art. 25 Code du Travail CI : 2,5 jours de congé par mois de travail effectif
 * Plafond légal : 30 jours par an (base, sans bonus ancienneté en v1)
 */

export interface SoldeConges {
  jours_acquis: number;
  jours_pris: number;
  solde: number;
  annee: number;
}

/**
 * Calcule le nombre de jours de congés acquis pour une année donnée.
 * Règle : 2,5 jours par mois complet travaillé dans l'année.
 * Un mois est complet si l'employé était présent le 1er du mois.
 * Plafond : 30 jours/an.
 *
 * @param dateEmbauche - Date d'embauche au format ISO (YYYY-MM-DD)
 * @param annee - Année pour laquelle calculer les droits
 * @returns Nombre de jours acquis (0 à 30)
 */
export function calculerJoursAcquis(dateEmbauche: string, annee: number): number {
  // Interpréter la date d'embauche en timezone Africa/Abidjan (UTC+0)
  // Abidjan est UTC+0 donc on peut traiter en UTC directement
  const parts = dateEmbauche.split('-');
  const anneeEmbauche = parseInt(parts[0], 10);
  const moisEmbauche = parseInt(parts[1], 10); // 1-12
  const jourEmbauche = parseInt(parts[2], 10);

  let moisComplets = 0;

  // Pour chaque mois de l'année cible, vérifier si l'employé était présent le 1er
  for (let mois = 1; mois <= 12; mois++) {
    // L'employé est présent le 1er du mois si :
    // - Son année d'embauche est antérieure à l'année cible, OU
    // - Son année d'embauche est l'année cible ET son mois d'embauche est <= mois courant
    //   ET si c'est le même mois, l'embauche est le 1er jour (présent dès le 1er)
    //   Si l'embauche est après le 1er du mois, ce mois n'est pas complet

    const present = estPresentLe1erDuMois(anneeEmbauche, moisEmbauche, jourEmbauche, annee, mois);
    if (present) {
      moisComplets++;
    }
  }

  const joursAcquis = moisComplets * 2.5;
  // Plafond légal 30 jours/an
  return Math.min(joursAcquis, 30);
}

/**
 * Vérifie si l'employé était présent le 1er d'un mois donné.
 * L'employé est présent le 1er si son embauche est antérieure ou égale au 1er du mois.
 */
function estPresentLe1erDuMois(
  anneeEmbauche: number,
  moisEmbauche: number,
  jourEmbauche: number,
  annee: number,
  mois: number
): boolean {
  // Date du 1er du mois cible
  // L'employé est présent si date_embauche <= 1er du mois cible
  if (anneeEmbauche < annee) {
    // Embauché avant l'année cible → présent tout le mois
    return true;
  }
  if (anneeEmbauche > annee) {
    // Embauché après l'année cible → pas encore en poste
    return false;
  }
  // Même année
  if (moisEmbauche < mois) {
    // Embauché dans un mois antérieur de l'année → présent le 1er
    return true;
  }
  if (moisEmbauche > mois) {
    // Embauché dans un mois ultérieur de l'année → pas encore en poste
    return false;
  }
  // Même mois : présent le 1er uniquement si embauché le 1er
  return jourEmbauche === 1;
}

/**
 * Calcule le solde de congés restant.
 * Le solde ne peut jamais être négatif.
 *
 * @param joursAcquis - Jours de congés acquis
 * @param jours_pris - Jours déjà pris (congés approuvés)
 * @returns Solde restant (>= 0)
 */
export function calculerSoldeConges(joursAcquis: number, jours_pris: number): number {
  return Math.max(0, joursAcquis - jours_pris);
}
