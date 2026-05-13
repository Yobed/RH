/**
 * Calcul bulletin de paie — Droit ivoirien
 * Sources :
 *   - Code du Travail ivoirien CI (Loi n°2015-532 du 20 juillet 2015, mis à jour 2025)
 *   - Convention Collective Interprofessionnelle ASSIM-UGTCI
 *   - Décret n°2022-986 (SMIG 75 000 FCFA au 01/01/2023)
 *   - CNPS CI — retraite salariale 6,30% / plafond 1 647 315 FCFA/mois
 *   - CNAM — CMU forfait mensuel 1 600 FCFA (part salariale + part patronale)
 *
 * ⚠️  VÉRIFICATION ANNUELLE OBLIGATOIRE
 * - SMIG       : peut être révisé par décret ministériel
 * - Tranches ITS : peuvent être modifiées par la Loi de Finances annuelle
 * - Taux CNPS  : à confirmer auprès de la CNPS CI
 * - AT/MP      : taux variable selon secteur (3% = taux moyen indicatif)
 *
 * Dernière mise à jour : mars 2026
 */

import { calculerICCP } from '@/lib/conges-ci';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une date de manière sécurisée pour l'affichage.
 * Gère les valeurs nulles, indéfinies et invalides sans planter.
 */
export function safeFormatDate(date: any, formatStr: string = "dd/MM/yyyy"): string {
  if (!date) return "-";
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(d)) return "-";
    return format(d, formatStr, { locale: fr });
  } catch (e) {
    return "-";
  }
}

// SMIG mensuel en vigueur depuis le 01/01/2023
// Source : Décret n°2022-986 du Ministère de l'Emploi CI
export const SMIG_MENSUEL = 75_000;
export const SMIG_HORAIRE = Math.round(SMIG_MENSUEL / 173.33); // ≈ 433 FCFA/h

// CNPS retraite salariale : 6,30 % du brut
// Règle métier :
//   - Plancher : si brut < 75 000, on applique les 6,3 % sur 75 000
//   - Plafond  : si brut > 3 375 000, on applique les 6,3 % sur 3 375 000
//     (45 × SMIG)
export const TAUX_CNPS_RETRAITE_SALARIE = 0.063;
export const PLANCHER_CNPS_MENSUEL = 75_000;
export const PLAFOND_CNPS_MENSUEL = 3_375_000;
// Alias compatibilité descendante
export const TAUX_CNPS_SALARIE = TAUX_CNPS_RETRAITE_SALARIE;
export const PLAFOND_CNPS = PLAFOND_CNPS_MENSUEL;

/**
 * Calcule la base CNPS en appliquant le plancher (75 000) et le plafond
 * (3 075 000) au brut fourni. Si le brut est nul/négatif, la base est 0.
 */
export function calculerBaseCNPS(brut: number): number {
  if (brut <= 0) return 0;
  if (brut < PLANCHER_CNPS_MENSUEL) return PLANCHER_CNPS_MENSUEL;
  if (brut > PLAFOND_CNPS_MENSUEL) return PLAFOND_CNPS_MENSUEL;
  return brut;
}

// CMU (CNAM) — Couverture Maladie Universelle
// 1 000 FCFA par personne à charge dans la famille
// (chef + conjoint si marié/pacsé + enfants à charge).
// Cotisation répartie 50 % employeur / 50 % employé.
export const CMU_PAR_PERSONNE = 1_000;

/**
 * @deprecated Conservé pour rétro-compatibilité. La CMU est désormais
 * calculée proportionnellement à la taille de la famille via
 * `calculerCMU()`. Cette constante représente le forfait legacy
 * (avant réforme), à ne plus utiliser dans un nouveau code.
 */
export const CMU_MENSUEL = 1_600;

/**
 * @deprecated L'ITS (réforme client) s'applique directement sur le brut fiscal,
 * sans abattement 15 % ni déduction CNPS. Conservé pour compatibilité.
 */
export const TAUX_ABATTEMENT_ITS = 0;

// Charges patronales CNPS CI
export const CHARGES_PATRONALES_TAUX = {
  familiales: 0.05,      // Prestations familiales (sans plafond)
  maternite: 0.0075,     // Accidents maternité
  retraite: 0.077,       // Retraite patronale (plafond PLAFOND_CNPS_MENSUEL)
  at_mp: 0.03,           // Accidents travail / Maladies pro — taux moyen par défaut (variable selon secteur 2-5%)
  fdfp: 0.012,           // Taxe de Formation Continue (FDFP) 1.2%
  apprentissage: 0.004,  // Taxe d'Apprentissage 0.4%
} as const;

/**
 * Taux AT/MP minimum et maximum acceptables (cadrage CNPS CI).
 * Le taux exact dépend du secteur d'activité — récupéré dans `companies.taux_at_mp`.
 */
export const TAUX_AT_MP_MIN = 0.02;
export const TAUX_AT_MP_MAX = 0.05;
export const TAUX_AT_MP_DEFAULT = CHARGES_PATRONALES_TAUX.at_mp;

/**
 * Statut familial pour le calcul du quotient familial (ITS).
 * Correspond aux valeurs stockées dans employees.etat_civil.
 */
export type EtatCivilFiscal =
  | 'Célibataire'
  | 'Marié(e)'
  | 'Divorcé(e)'
  | 'Veuf/Veuve'
  | 'Pacsé(e)';

/**
 * Calcul du nombre de parts fiscales — Quotient familial CI.
 * Barème DGI CI post-réforme 2024 (Art. 116 CGI CI) :
 *   - Célibataire / Divorcé / Veuf sans enfant : 1 part
 *   - Marié / Pacsé sans enfant                : 2 parts
 *   - Veuf avec enfant à charge                : 2 parts (assimilé marié)
 *   - Célibataire / Divorcé avec enfant(s)     : +0,5 part « chef de famille »
 *   - +0,5 part par enfant à charge
 *   - Plafond : 5 parts
 */
export const PARTS_MAX = 5;

export function calculerPartsFiscales(
  etatCivil: EtatCivilFiscal | string | null | undefined,
  nbEnfants: number | null | undefined = 0
): number {
  const enfants = Math.max(0, Math.floor(nbEnfants ?? 0));
  const isMarie = etatCivil === 'Marié(e)' || etatCivil === 'Pacsé(e)';
  const isVeuf = etatCivil === 'Veuf/Veuve';

  // Base : marié/pacsé = 2 ; veuf AVEC enfant à charge = 2 (assimilé marié) ; sinon 1
  let base: number;
  if (isMarie) base = 2;
  else if (isVeuf && enfants >= 1) base = 2;
  else base = 1;

  // Bonus chef de famille : célibataire/divorcé avec au moins 1 enfant → +0,5
  const isCelibOrDiv = !isMarie && !isVeuf;
  const chefFamilleBonus = isCelibOrDiv && enfants >= 1 ? 0.5 : 0;

  return Math.min(PARTS_MAX, base + chefFamilleBonus + enfants * 0.5);
}

/**
 * Taille de la famille (chef + conjoint éventuel + enfants à charge).
 * Sert de base au calcul CMU.
 */
export function calculerTailleFamille(
  etatCivil: EtatCivilFiscal | string | null | undefined,
  nbEnfants: number | null | undefined = 0
): number {
  const enfants = Math.max(0, Math.floor(nbEnfants ?? 0));
  const conjoint = etatCivil === 'Marié(e)' || etatCivil === 'Pacsé(e)' ? 1 : 0;
  return 1 + conjoint + enfants;
}

export interface CMUDetail {
  taille_famille: number;
  total: number;
  employe: number;
  employeur: number;
}

/**
 * Cotisation CMU mensuelle proportionnelle à la taille du foyer.
 *   total      = 1 000 FCFA × taille_famille
 *   employe    = total / 2
 *   employeur  = total / 2
 */
export function calculerCMU(
  etatCivil: EtatCivilFiscal | string | null | undefined,
  nbEnfants: number | null | undefined = 0
): CMUDetail {
  const taille_famille = calculerTailleFamille(etatCivil, nbEnfants);
  const total = taille_famille * CMU_PAR_PERSONNE;
  const employe = Math.round(total / 2);
  const employeur = total - employe;
  return { taille_famille, total, employe, employeur };
}

/**
 * RICF — Réduction d'Impôt pour Charge de Famille (mensuelle, FCFA).
 * Barème DGI CI : 11 000 FCFA par demi-part au-dessus de 1 part.
 *   1 part   → 0
 *   2 parts  → 11 000
 *   2,5      → 16 500
 *   3        → 22 000
 *   3,5      → 27 500
 *   4        → 33 000
 *   4,5      → 38 500
 *   5 parts  → 44 000 (plafond)
 */
export const RICF_PAR_DEMI_PART = 5_500;

export function calculerRICF(parts: number): number {
  const p = Math.max(1, Math.min(PARTS_MAX, parts || 1));
  if (p <= 1) return 0;
  // Chaque demi-part supplémentaire au-dessus de 1 vaut 5 500 FCFA
  // (parts - 1) * 2 demi-parts × 5 500 = (parts - 1) × 11 000
  return Math.round((p - 1) * 2 * RICF_PAR_DEMI_PART);
}

/**
 * Application du barème ITS à une base donnée. Retourne l'ITS BRUT
 * (avant réduction pour charge de famille).
 */
function appliquerBaremeITS(base: number): number {
  if (base <= 0) return 0;

  // Barème mensuel progressif ITS CI unifié (Réforme 2024, Art. 116 CGI CI)
  const tranches = [
    { limite: 75_000, taux: 0 },
    { limite: 240_000, taux: 0.16 },
    { limite: 800_000, taux: 0.21 },
    { limite: 2_400_000, taux: 0.24 },
    { limite: 8_000_000, taux: 0.28 },
    { limite: Infinity, taux: 0.32 },
  ];

  let its = 0;
  let reste = base;
  let precedente = 0;

  for (const tranche of tranches) {
    if (reste <= 0) break;
    const partTranche = Math.min(reste, tranche.limite - precedente);
    its += partTranche * tranche.taux;
    reste -= partTranche;
    precedente = tranche.limite;
  }

  return its;
}

/**
 * Calcul ITS (Impôt sur Traitement et Salaires) — Barème CI avec RICF.
 *
 * Logique légale CI (Art. 116 CGI) :
 *   1. ITS_Brut    = barème progressif appliqué sur base imposable (sans découpage)
 *   2. RICF        = montant forfaitaire selon nombre de parts
 *   3. ITS_Salarial = max(0, ITS_Brut − RICF)
 *
 * Le paramètre `parts` (défaut 1) active la déduction RICF.
 * Si `parts` <= 1, ITS_Salarial = ITS_Brut (pas de réduction).
 *
 * @param salaireImposable Base imposable mensuelle en FCFA
 * @param parts Nombre de parts fiscales (1 → 5)
 */
export function calculerITS(salaireImposable: number, parts: number = 1): number {
  if (salaireImposable <= 0) return 0;
  const itsBrut = Math.round(appliquerBaremeITS(salaireImposable));
  const ricf = calculerRICF(parts);
  return Math.max(0, itsBrut - ricf);
}

/**
 * Variante détaillée — retourne ITS brut, RICF et ITS salarial séparés.
 * Utile pour l'affichage du bulletin (transparence du calcul).
 */
export function calculerITSDetail(
  salaireImposable: number,
  parts: number = 1
): { its_brut: number; ricf: number; its_salarial: number } {
  if (salaireImposable <= 0) return { its_brut: 0, ricf: 0, its_salarial: 0 };
  const its_brut = Math.round(appliquerBaremeITS(salaireImposable));
  const ricf = calculerRICF(parts);
  const its_salarial = Math.max(0, its_brut - ricf);
  return { its_brut, ricf, its_salarial };
}

export interface ResultatPaie {
  salaire_brut: number;
  cnps_retraite: number;            // 6,3% plafonné
  cmu_salarie: number;              // CMU part salariale = 500 × taille du foyer
  cnps_salarie: number;             // Total salarial : cnps_retraite + cmu_salarie
  base_imposable: number;
  parts_fiscales: number;           // Nombre de parts utilisé pour le RICF
  its_brut: number;                 // ITS calculé sur barème avant RICF
  ricf: number;                     // Réduction d'Impôt pour Charge de Famille
  its: number;                      // ITS salarial = max(0, its_brut - ricf)
  salaire_net_avant_retenues: number;
  salaire_net: number;
}

export interface SituationFamiliale {
  etat_civil?: EtatCivilFiscal | string | null;
  nb_enfants?: number | null;
}

export function calculerBulletin(
  salaireBrut: number,
  autresRetenues = 0,
  avances = 0,
  situationFamiliale: SituationFamiliale = {}
): ResultatPaie {
  // CNPS retraite salariale — 6,3 % de la base CNPS bornée
  // [PLANCHER 75 000 ; PLAFOND 3 375 000]
  const baseCNPS = calculerBaseCNPS(salaireBrut);
  const cnps_retraite = Math.round(baseCNPS * TAUX_CNPS_RETRAITE_SALARIE);

  // CMU salariale — 1 000 FCFA × taille du foyer, part salariale = 50 %
  const cmuDetail = calculerCMU(
    situationFamiliale.etat_civil,
    situationFamiliale.nb_enfants
  );
  const cmu_salarie = cmuDetail.employe;

  // Total retenu salarié
  const cnps_salarie = cnps_retraite + cmu_salarie;

  // Base imposable ITS = brut fiscal (la réforme client applique le barème
  // directement sur le brut, sans abattement 15 % ni déduction CNPS).
  const base_imposable = Math.max(0, Math.round(salaireBrut));

  // ITS brut sur barème puis RICF — Art. 116 CGI CI
  const parts_fiscales = calculerPartsFiscales(
    situationFamiliale.etat_civil,
    situationFamiliale.nb_enfants
  );
  const { its_brut, ricf, its_salarial: its } = calculerITSDetail(
    base_imposable,
    parts_fiscales
  );

  const salaire_net_avant_retenues = salaireBrut - cnps_salarie - its;
  const salaire_net = salaire_net_avant_retenues - autresRetenues - avances;

  return {
    salaire_brut: salaireBrut,
    cnps_retraite,
    cmu_salarie,
    cnps_salarie,
    base_imposable,
    parts_fiscales,
    its_brut,
    ricf,
    its,
    salaire_net_avant_retenues,
    salaire_net: Math.max(0, salaire_net),
  };
}

export interface ChargesPatronales {
  familiales: number;    // 5% de la masse salariale (sans plafond)
  maternite: number;     // 0,75%
  retraite: number;      // 7,7% plafonné
  at_mp: number;         // 3% (taux moyen)
  cmu: number;           // CMU patronale forfait
  fdfp: number;          // FDFP 1.2%
  apprentissage: number; // Apprentissage 0.4%
  total: number;
}

export function calculerChargesPatronales(
  salaireBrut: number,
  tauxAtMp: number = CHARGES_PATRONALES_TAUX.at_mp,
  situationFamiliale: SituationFamiliale = {}
): ChargesPatronales {
  const familiales = Math.round(salaireBrut * CHARGES_PATRONALES_TAUX.familiales);

  const maternite = Math.round(salaireBrut * CHARGES_PATRONALES_TAUX.maternite);

  const baseRetraite = calculerBaseCNPS(salaireBrut);
  const retraite = Math.round(baseRetraite * CHARGES_PATRONALES_TAUX.retraite);

  // Le taux AT/MP peut varier d'une entreprise à l'autre (généralement entre 2% et 5%)
  const at_mp = Math.round(salaireBrut * tauxAtMp);

  // CMU patronale = 50 % de la cotisation totale (1 000 × taille_famille)
  const cmu = calculerCMU(
    situationFamiliale.etat_civil,
    situationFamiliale.nb_enfants
  ).employeur;

  const fdfp = Math.round(salaireBrut * CHARGES_PATRONALES_TAUX.fdfp);
  const apprentissage = Math.round(salaireBrut * CHARGES_PATRONALES_TAUX.apprentissage);

  const total = familiales + maternite + retraite + at_mp + cmu + fdfp + apprentissage;

  return { familiales, maternite, retraite, at_mp, cmu, fdfp, apprentissage, total };
}

// ── Provision 13e mois / Prime exceptionnelle — prorata temporis ────────
// Base légale : usage courant CI + CCI interprofessionnelle
// Calcul mensuel : 1/12 du salaire catégoriel par mois de présence
// Le prorata est naturel : l'employé accumule 1/12 chaque mois travaillé,
// donc un embauché en juillet obtient 6/12 à la fin de l'année.
export function calculerProvision13e(salaireBrut: number): number {
  if (salaireBrut <= 0) return 0;
  // 13e mois annuel = 75% du salaire de base → provision mensuelle = 75% / 12
  return Math.round(salaireBrut * 0.75 / 12);
}

// ── Prime d'ancienneté — CCI AINSI-UGTCI Art. 17 ────────────────────────
// Règle métier client :
//   - 0 % en deçà de 2 ans d'ancienneté révolus
//   - n % du salaire de base pour n années d'ancienneté (2 % à 2 ans,
//     3 % à 3 ans, …)
//   - Plafond 25 % atteint à la 25ᵉ année et au-delà
//   - Variante BTP : plafond ramené à 20 %
// Source : Convention Collective Interprofessionnelle CI
export function calculerPrimeAnciennete(
  salaireCat: number,
  dateEmbauche: string | null | undefined,
  convention: string = 'Interprofessionnelle'
): number {
  if (!dateEmbauche) return 0;
  const debut = new Date(dateEmbauche);
  if (isNaN(debut.getTime())) return 0;

  const now = new Date();
  // Années complètes de service
  let annees = now.getFullYear() - debut.getFullYear();
  const moisPasse =
    now.getMonth() > debut.getMonth() ||
    (now.getMonth() === debut.getMonth() && now.getDate() >= debut.getDate());
  if (!moisPasse) annees -= 1;

  // Pas de prime tant que 2 années révolues ne sont pas atteintes
  if (annees < 2) return 0;

  const plafondTaux = convention === 'BTP' ? 0.20 : 0.25;
  const taux = Math.min(annees / 100, plafondTaux);

  return Math.round(salaireCat * taux);
}

// ── Indemnité de licenciement — Art. 74 Code du Travail ivoirien CI ─────
// Source : Décret n°96-201 du 7 mars 1996 / CCI Art. 39
// Base = salaire global mensuel moyen des 12 derniers mois (pas le salaire actuel)
// Tranches : 30% (1–5 ans) · 35% (6–10 ans) · 40% (11 ans et +)
// Plafond : pas de plafond pour le licenciement (départ retraite : 25 × SMIG annuel)
export function calculerIndemniteLicenciement(salaireMoyen12Mois: number, annees: number): number {
  if (annees < 1) return 0;
  
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

// ── Majorations heures supplémentaires ─────────────────────────────────
// Règle métier client (alignée Décret n° 96-203 du 7 mars 1996) :
//   - 15 %  : 41ᵉ à 46ᵉ heure en semaine
//   - 50 %  : au-delà de la 46ᵉ heure en semaine
//   - 75 %  : en journée un dimanche ou un jour férié
//             (+ heure de nuit en semaine, par usage CI)
//   - 100 % : la nuit d'un dimanche ou d'un jour férié
export const MAJORATIONS_HEURES_SUP = {
  semaine_41_46: 0.15,
  semaine_au_dela_46: 0.50,
  jour_dimanche_ferie: 0.75,
  nuit_semaine: 0.75,
  nuit_dimanche_ferie: 1.00,
  // Aliases conservés pour rétro-compatibilité — éviter dans le nouveau code
  /** @deprecated Utiliser `jour_dimanche_ferie` */
  dimanche: 0.75,
  /** @deprecated Utiliser `jour_dimanche_ferie` */
  jour_ferie: 0.75,
  /** @deprecated Utiliser `nuit_semaine` ou `nuit_dimanche_ferie` selon le contexte */
  nuit: 0.75,
} as const;

export function calculerHeuresSup(nbH15: number, nbH50: number, nbH75: number, nbH100: number, tauxHoraire: number): number {
  const h15 = nbH15 * tauxHoraire * (1 + MAJORATIONS_HEURES_SUP.semaine_41_46);
  const h50 = nbH50 * tauxHoraire * (1 + MAJORATIONS_HEURES_SUP.semaine_au_dela_46);
  const h75 = nbH75 * tauxHoraire * (1 + MAJORATIONS_HEURES_SUP.jour_dimanche_ferie);
  const h100 = nbH100 * tauxHoraire * (1 + MAJORATIONS_HEURES_SUP.nuit_dimanche_ferie);
  return Math.round(h15 + h50 + h75 + h100);
}

// ── Préavis CDI — Art. 34 Code du Travail ivoirien CI ───────────────────
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

/**
 * Prime paramétrable rattachée au contrat de l'employé.
 *   - imposable = true  → entre dans le brut (soumise CNPS + ITS)
 *   - imposable = false → exonérée, ajoutée directement au net
 * Stockée dans la table `contract_primes`.
 */
export interface PrimeContrat {
  libelle: string;
  montant: number;
  imposable: boolean;
}

export interface LignesBulletin {
  salaire_brut: number;
  sursalaire?: number;
  prime_anciennete?: number;
  prime_exceptionnelle?: number;
  prime_salissure?: number;
  prime_depassement?: number;
  prime_fonction?: number;
  prime_transport?: number;
  /**
   * Primes libres définies sur le contrat (table contract_primes).
   * Chacune est ajoutée soit au brut imposable soit au net selon `imposable`.
   */
  primes_contrat?: PrimeContrat[];
  vacation_allowance?: number;     // Indemnité congés payés (Sage) — exonérée
  prime_logement?: number;         // Prime de logement — exonérée CI
  prime_responsabilite?: number;   // Prime de responsabilité — imposable
  remboursement_frais?: number;    // Remboursement de frais — exonéré
  heures_normales?: number;        // Heures normales du mois (affichage bulletin)
  /**
   * Heures supplémentaires par bucket de majoration :
   *   h15  → 41ᵉ-46ᵉ heure en semaine (15 %)
   *   h50  → au-delà de la 46ᵉ heure en semaine (50 %)
   *   h75  → jour dimanche/férié (75 %)
   *   h100 → nuit dimanche/férié (100 %)
   */
  heures_sup?: {
    h15: number;
    h50: number;
    h75: number;
    h100?: number;
  };
  // Maladie — Maintien de salaire (CCI Art. 42)
  jours_maladie_total?: number;    // Nombre total de jours d'arrêt dans le mois
  jours_maladie_plein_tarif?: number; // Jours maintenus à 100%
  jours_maladie_demi_tarif?: number;  // Jours maintenus à 50%
  // Heures à taux spéciaux — saisie séparée (additionnée aux buckets h75 / h100)
  heures_nuit_semaine?: number;           // Nuit en semaine (21h–5h) → 75 %
  heures_jour_dimanche_ferie?: number;    // Journée un dimanche/férié → 75 %
  heures_nuit_dimanche_ferie?: number;    // Nuit un dimanche/férié → 100 %
  /** @deprecated alias historique de `heures_nuit_semaine` */
  heures_nuit?: number;
  /** @deprecated alias historique de `heures_jour_dimanche_ferie` */
  heures_dimanche?: number;
  /** @deprecated alias historique de `heures_jour_dimanche_ferie` */
  heures_ferie?: number;
  // RTT — accord d'entreprise (non prévu par le CT-CI, usage conventionnel)
  jours_rtt_pris?: number;         // Jours RTT pris ce mois (déduction si sans solde)
  taux_horaire?: number;
  autres_retenues?: number;
  avances?: number;
  nb_jours_absence?: number;
  // Situation familiale pour quotient familial ITS (Art. 116 CGI CI)
  etat_civil?: EtatCivilFiscal | string | null;
  nb_enfants?: number | null;
}

// Taux Contribution Nationale CI — solidarité employé
export const TAUX_CN = 0.015;

export interface ResultatPaieComplet {
  // Colonnes existantes (rétrocompatibilité)
  total_brut: number;
  total_imposable: number;
  cnps_retraite: number;
  cmu: number;
  cnps_salarie: number;
  its: number;
  total_retenues: number;
  salaire_net: number;
  heures_sup_montant: number;
  retenu_absence: number;
  indemnite_maladie?: number;     // Montant total du maintien de salaire
  parts_fiscales?: number;        // Nombre de parts fiscales appliqué pour le RICF
  its_brut?: number;              // ITS calculé sur barème avant RICF
  ricf?: number;                  // Réduction d'Impôt pour Charge de Famille
  primes_imposables_total?: number;     // Somme des primes libres imposables (entrent dans le brut)
  primes_non_imposables_total?: number; // Somme des primes libres exonérées (ajoutées au net)
  // Colonnes Sage (22 colonnes)
  gross_salary: number;           // *** SALAIRE BRUT *** = total_brut
  exempt_indemnity: number;       // *** INDEMNITE EXONEREE *** = prime_transport
  fiscal_gross: number;           // *** BRUT FISCAL *** = total_imposable
  social_gross: number;           // *** BRUT SOCIAL *** = total_brut - exempt_indemnity
  tax_is: number;                 // IS patronal — non retenu sur salarié = 0
  tax_cn: number;                 // Contribution Nationale 1,5%
  tax_igr: number;                // IGR (barème progressif = its existant)
  withholding_cnps: number;       // Retenue CNPS salariale = cnps_salarie
  total_contributions: number;    // Total cotisations = cnps_salarie + tax_cn + tax_igr
  net_before_withholding: number; // NET AVANT RETENUE = gross_salary - total_contributions
  net_to_pay: number;             // NET A PAYER = salaire_net final
  overtime_pay: number;           // Heures supplémentaires montant
}

/**
 * Retenue pour absence non justifiée — droit CI
 * Base : salaire journalier = salaire_brut / 26 jours ouvrables (standard cabinet comptable CI)
 */
export function calculerRetenuAbsence(nbJoursAbsence: number, salaireBrut: number): number {
  if (nbJoursAbsence <= 0 || salaireBrut <= 0) return 0;
  return Math.round((salaireBrut / 26) * nbJoursAbsence);
}

export function calculerBulletinComplet(lignes: LignesBulletin): ResultatPaieComplet {
  const primeTransport = lignes.prime_transport ?? 0;
  const vacationAllowance = lignes.vacation_allowance ?? 0;
  const primeLogement = lignes.prime_logement ?? 0;
  const remboursementFrais = lignes.remboursement_frais ?? 0;
  const primeResponsabilite = lignes.prime_responsabilite ?? 0;

  const heures_normales = lignes.heures_normales ?? 173.33;
  const taux_horaire = lignes.taux_horaire ?? Math.round(((lignes.salaire_brut ?? 0) + (lignes.sursalaire ?? 0)) / heures_normales);
  const heures_sup_montant = lignes.heures_sup
    ? calculerHeuresSup(lignes.heures_sup.h15, lignes.heures_sup.h50, lignes.heures_sup.h75, lignes.heures_sup.h100 || 0, taux_horaire)
    : 0;

  // Heures spéciales — règles métier client :
  //   75 %  : nuit en semaine + journée d'un dimanche/férié
  //   100 % : nuit d'un dimanche/férié
  // On accepte les nouveaux champs (heures_nuit_semaine,
  // heures_jour_dimanche_ferie, heures_nuit_dimanche_ferie) et les
  // anciens (heures_nuit, heures_dimanche, heures_ferie) en compat.
  const h_nuit_semaine = (lignes.heures_nuit_semaine ?? lignes.heures_nuit ?? 0);
  const h_jour_dim_ferie =
    (lignes.heures_jour_dimanche_ferie ?? 0) +
    (lignes.heures_dimanche ?? 0) +
    (lignes.heures_ferie ?? 0);
  const h_nuit_dim_ferie = (lignes.heures_nuit_dimanche_ferie ?? 0);

  const heures_speciales_montant = Math.round(
    h_nuit_semaine * taux_horaire * (1 + MAJORATIONS_HEURES_SUP.nuit_semaine) +
      h_jour_dim_ferie * taux_horaire * (1 + MAJORATIONS_HEURES_SUP.jour_dimanche_ferie) +
      h_nuit_dim_ferie * taux_horaire * (1 + MAJORATIONS_HEURES_SUP.nuit_dimanche_ferie)
  );

  // Primes libres définies sur le contrat — ventilation imposable / non imposable
  const primesContrat = lignes.primes_contrat ?? [];
  const primes_imposables_total = primesContrat
    .filter((p) => p && p.imposable)
    .reduce((s, p) => s + (Number(p.montant) || 0), 0);
  const primes_non_imposables_total = primesContrat
    .filter((p) => p && !p.imposable)
    .reduce((s, p) => s + (Number(p.montant) || 0), 0);

  const total_brut = (lignes.salaire_brut ?? 0)
    + (lignes.sursalaire ?? 0)
    + (lignes.prime_anciennete ?? 0)
    + (lignes.prime_exceptionnelle ?? 0)
    + (lignes.prime_salissure ?? 0)
    + (lignes.prime_depassement ?? 0)
    + (lignes.prime_fonction ?? 0)
    + primeResponsabilite
    + heures_sup_montant
    + heures_speciales_montant
    + primeTransport
    + vacationAllowance
    + primeLogement
    + remboursementFrais
    + primes_imposables_total
    + primes_non_imposables_total;

  // Éléments non soumis à ITS : transport + congés payés + logement + remboursements
  // + primes libres marquées non imposables
  const total_imposable = Math.max(
    0,
    total_brut
      - primeTransport
      - vacationAllowance
      - primeLogement
      - remboursementFrais
      - primes_non_imposables_total
  );

  // CNPS — 6,3 % de la base CNPS bornée [PLANCHER 75 000 ; PLAFOND 3 375 000]
  const base_cnps = calculerBaseCNPS(total_imposable);
  const cnps_retraite = Math.round(base_cnps * TAUX_CNPS_RETRAITE_SALARIE);

  // CMU — 1 000 FCFA × taille du foyer, part salariale = 50 %
  const cmuDetail = calculerCMU(lignes.etat_civil, lignes.nb_enfants);
  const cmu = cmuDetail.employe;

  // ITS — barème appliqué directement sur le brut fiscal
  // (réforme client : pas d'abattement 15 %, pas de déduction CNPS préalable)
  const parts_fiscales = calculerPartsFiscales(lignes.etat_civil, lignes.nb_enfants);
  const itsDetail = calculerITSDetail(total_imposable, parts_fiscales);
  const its_brut = itsDetail.its_brut;
  const ricf = itsDetail.ricf;
  const its = itsDetail.its_salarial;

  const retenu_absence = calculerRetenuAbsence(lignes.nb_jours_absence ?? 0, lignes.salaire_brut);

  // Calcul Maintien Maladie (Indemnité compensatrice de salaire)
  // On déduit d'abord l'absence totale, puis on rajoute l'indemnité de maintien
  const salaire_journalier = (lignes.salaire_brut ?? 0) / 26;
  const indemnite_maladie = Math.round(
    ((lignes.jours_maladie_plein_tarif ?? 0) * salaire_journalier) +
    ((lignes.jours_maladie_demi_tarif ?? 0) * salaire_journalier * 0.5)
  );

  const cnps_salarie = cnps_retraite + cmu;

  const total_retenues = cnps_salarie + its
    + (lignes.autres_retenues ?? 0)
    + (lignes.avances ?? 0)
    + retenu_absence;

  const salaire_net = Math.max(0, total_brut + indemnite_maladie - total_retenues);

  // Colonnes Sage
  const exempt_indemnity =
    primeTransport + vacationAllowance + primeLogement + remboursementFrais + primes_non_imposables_total;
  const gross_salary = total_brut;
  const fiscal_gross = total_imposable;
  const social_gross = total_brut - exempt_indemnity;
  const tax_is = 0; // IS = charge patronale, non retenue sur le salarié
  const tax_cn = Math.round(fiscal_gross * TAUX_CN);
  const tax_igr = its; // IGR = barème progressif existant
  const withholding_cnps = cnps_salarie;
  const total_contributions = withholding_cnps + tax_cn + tax_igr;
  const net_before_withholding = gross_salary - total_contributions;
  const net_to_pay = Math.max(0, gross_salary - total_contributions - (lignes.autres_retenues ?? 0) - (lignes.avances ?? 0) - retenu_absence);

  return {
    total_brut,
    total_imposable,
    cnps_retraite,
    cmu,
    cnps_salarie,
    its,
    total_retenues,
    salaire_net,
    heures_sup_montant,
    retenu_absence,
    gross_salary,
    exempt_indemnity,
    fiscal_gross,
    social_gross,
    tax_is,
    tax_cn,
    tax_igr,
    withholding_cnps,
    total_contributions,
    net_before_withholding,
    net_to_pay,
    overtime_pay: heures_sup_montant,
    indemnite_maladie,
    parts_fiscales,
    its_brut,
    ricf,
    primes_imposables_total,
    primes_non_imposables_total,
  };
}

/**
 * Calcul les droits de maintien de salaire en cas de maladie (CCI Art. 42)
 * @param ancienneteAnnees 
 * @returns { plein: number, demi: number } (en mois de droits cumulés)
 */
export function getDroitsMaladieCCI(ancienneteAnnees: number): { plein: number; demi: number } {
  if (ancienneteAnnees < 1) return { plein: 1, demi: 0 }; // Par défaut : préavis (souvent 1 mois)
  if (ancienneteAnnees < 5) return { plein: 1, demi: 1 };
  if (ancienneteAnnees < 10) return { plein: 2, demi: 2 };
  return { plein: 3, demi: 3 };
}

export function formatAnciennete(dateEmbauche: string | null | undefined): string {
  if (!dateEmbauche) return "0 jour";
  const parts = dateEmbauche.split("-");
  if (parts.length < 3) return "0 jour";
  
  const [y, m, dstr] = parts;
  const debut = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(dstr.substring(0, 2), 10));
  if (isNaN(debut.getTime())) return "0 jour";
  const now = new Date();
  
  let years = now.getFullYear() - debut.getFullYear();
  let months = now.getMonth() - debut.getMonth();
  let days = now.getDate() - debut.getDate();
  
  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  if (years === 0 && months === 0) return `${days} jour${days > 1 ? "s" : ""}`;
  
  const yStr = String(years).padStart(2, "0");
  const mStr = String(months).padStart(2, "0");
  const dStr = String(days).padStart(2, "0");
  return `${yStr} an${years > 1 ? "s" : ""} ${mStr} mois ${dStr} jour${days > 1 ? "s" : ""}`;
}

// ── Calcul inversé : brut depuis net souhaité ────────────────────────────
// Utilise une dichotomie binaire convergente (60 itérations max, précision ±1 FCFA).
// Utile pour simulations recrutement ou négociation salariale.
export function calculerBrutDepuisNet(
  netSouhaite: number,
  autresRetenues = 0,
  avances = 0,
  situationFamiliale: SituationFamiliale = {}
): { brut: number; details: ResultatPaie } {
  if (netSouhaite <= 0) {
    const details = calculerBulletin(0, 0, 0, situationFamiliale);
    return { brut: 0, details };
  }
  let low = Math.max(SMIG_MENSUEL, netSouhaite);
  let high = Math.round(netSouhaite * 3);

  for (let i = 0; i < 60; i++) {
    const mid = Math.round((low + high) / 2);
    const details = calculerBulletin(mid, autresRetenues, avances, situationFamiliale);
    const ecart = details.salaire_net - netSouhaite;
    if (Math.abs(ecart) <= 1) return { brut: mid, details };
    if (ecart < 0) low = mid + 1;
    else high = mid - 1;
    if (low > high) break;
  }

  const brut = Math.round((low + high) / 2);
  return { brut, details: calculerBulletin(brut, autresRetenues, avances, situationFamiliale) };
}

// ════════════════════════════════════════════════════════════════════════
// CALCUL INVERSE PAR SUBSTITUTION — Sursalaire depuis Net souhaité
// ════════════════════════════════════════════════════════════════════════
// Équation de base :
//   NET = BRUT - CMU - CNPS - ITS_SALARIAL                 (avec primes non imp. ajoutées au net)
//   ITS_SALARIAL = max(0, ITS_BRUT - RICF)
//
// Sur une tranche donnée du barème ITS : ITS_BRUT = a × BRUT + b
// Sur la zone CNPS normale (75 000 ≤ BRUT ≤ 3 375 000) : CNPS = 0,063 × BRUT
//
// Cas 1 — ITS_BRUT ≤ RICF (donc ITS_SAL = 0) :
//   NET = BRUT × (1 − 0,063) − CMU
//   ⇒ BRUT = (NET + CMU) / 0,937
//
// Cas 2 — ITS_BRUT > RICF :
//   NET = BRUT × (1 − 0,063 − a) − b + RICF − CMU
//   ⇒ BRUT = (NET + CMU + b − RICF) / (1 − 0,063 − a)
//
// On essaie chaque combinaison (zone CNPS, tranche ITS, RICF/non) et on
// retient la solution qui retombe dans ses propres bornes.

export interface ParametresSursalaireDepuisNet {
  net_souhaite: number;
  salaire_base: number;                          // Salaire catégoriel
  date_embauche?: string | null;
  convention?: string;
  etat_civil?: EtatCivilFiscal | string | null;
  nb_enfants?: number | null;
  primes_contrat?: PrimeContrat[];
  autres_retenues?: number;
  avances?: number;
}

export interface ResultatSursalaireDepuisNet {
  sursalaire: number;
  prime_anciennete: number;
  primes_imposables_total: number;
  primes_non_imposables_total: number;
  brut_fiscal: number;              // Base CNPS / ITS = salaire_base + ancien. + sursalaire + imp.
  brut_total: number;               // Brut affiché = brut_fiscal + non imp.
  cnps_retraite: number;
  cmu_salarie: number;
  parts_fiscales: number;
  ricf: number;
  its_brut: number;
  its_salarial: number;
  net_calcule: number;              // Vérification : ≈ net_souhaite
  tranche_its_appliquee: number;    // Index 0..5
  ecart: number;                    // net_calcule − net_souhaite
}

// Représentation linéaire ITS_BRUT(BRUT) = a × BRUT + b par tranche
const TRANCHES_ITS_LINEAIRES = [
  { index: 0, bas: 0,         haut: 75_000,                 a: 0,    b: 0 },
  { index: 1, bas: 75_000,    haut: 240_000,                a: 0.16, b: -0.16 * 75_000 },        // -12 000
  { index: 2, bas: 240_000,   haut: 800_000,                a: 0.21, b: 26_400 - 0.21 * 240_000 }, // -24 000
  { index: 3, bas: 800_000,   haut: 2_400_000,              a: 0.24, b: 144_000 - 0.24 * 800_000 }, // -48 000
  { index: 4, bas: 2_400_000, haut: 8_000_000,              a: 0.28, b: 527_999 - 0.28 * 2_400_000 }, // -144 001
  { index: 5, bas: 8_000_000, haut: Number.POSITIVE_INFINITY, a: 0.32, b: 2_095_999 - 0.32 * 8_000_000 }, // -464 001
] as const;

// Zones CNPS : segment linéaire CNPS(BRUT) = α × BRUT + β
const ZONES_CNPS = [
  // Plancher : BRUT < 75 000 → CNPS forfaitaire 75 000 × 6,3 % = 4 725
  { bas: 0,         haut: 75_000,                 alpha: 0,                              beta: 75_000 * TAUX_CNPS_RETRAITE_SALARIE },
  // Zone proportionnelle
  { bas: 75_000,    haut: 3_375_000,              alpha: TAUX_CNPS_RETRAITE_SALARIE,     beta: 0 },
  // Plafond : BRUT > 3 375 000 → CNPS plafonné 3 375 000 × 6,3 % = 212 625
  { bas: 3_375_000, haut: Number.POSITIVE_INFINITY, alpha: 0,                              beta: 3_375_000 * TAUX_CNPS_RETRAITE_SALARIE },
] as const;

/**
 * Résout l'équation NET = BRUT − CMU − CNPS(BRUT) − max(0, ITS_BRUT(BRUT) − RICF)
 * par substitution algébrique sur chaque combinaison (zone CNPS, tranche ITS).
 *
 * Retourne `null` si aucune solution cohérente n'est trouvée (cas pathologique).
 */
function resoudreBrutFiscal(K: number, ricf: number): { brut: number; itsTrancheIndex: number } | null {
  // K = NET + CMU + retenues + avances − primes_non_imposables
  // On cherche BRUT tel que : K = BRUT − CNPS(BRUT) − max(0, ITS_BRUT(BRUT) − RICF)

  for (const zone of ZONES_CNPS) {
    for (const tr of TRANCHES_ITS_LINEAIRES) {
      // ── Cas A : ITS_SAL = 0 (ITS_BRUT ≤ RICF)
      // K = BRUT × (1 − α) − β
      // ⇒ BRUT = (K + β) / (1 − α)
      {
        const denom = 1 - zone.alpha;
        if (denom > 0) {
          const brut = (K + zone.beta) / denom;
          const its_brut = tr.a * brut + tr.b;
          if (
            brut >= zone.bas && brut < zone.haut &&
            brut >= tr.bas && brut < tr.haut &&
            its_brut <= ricf
          ) {
            return { brut, itsTrancheIndex: tr.index };
          }
        }
      }

      // ── Cas B : ITS_SAL = ITS_BRUT − RICF (ITS_BRUT > RICF)
      // K = BRUT × (1 − α − a) − β − b + RICF
      // ⇒ BRUT = (K + β + b − RICF) / (1 − α − a)
      {
        const denom = 1 - zone.alpha - tr.a;
        if (denom > 0) {
          const brut = (K + zone.beta + tr.b - ricf) / denom;
          const its_brut = tr.a * brut + tr.b;
          if (
            brut >= zone.bas && brut < zone.haut &&
            brut >= tr.bas && brut < tr.haut &&
            its_brut > ricf
          ) {
            return { brut, itsTrancheIndex: tr.index };
          }
        }
      }
    }
  }

  return null;
}

export function calculerSursalaireDepuisNet(
  params: ParametresSursalaireDepuisNet
): ResultatSursalaireDepuisNet {
  // ── 1. Éléments fixes (indépendants du sursalaire)
  const anciennete = calculerPrimeAnciennete(
    params.salaire_base,
    params.date_embauche,
    params.convention
  );
  const parts = calculerPartsFiscales(params.etat_civil, params.nb_enfants);
  const ricf = calculerRICF(parts);
  const cmu = calculerCMU(params.etat_civil, params.nb_enfants).employe;
  const autresRetenues = params.autres_retenues ?? 0;
  const avances = params.avances ?? 0;

  const primes = params.primes_contrat ?? [];
  const primesImpTotal = primes
    .filter((p) => p.imposable)
    .reduce((s, p) => s + (Number(p.montant) || 0), 0);
  const primesNonImpTotal = primes
    .filter((p) => !p.imposable)
    .reduce((s, p) => s + (Number(p.montant) || 0), 0);

  // Base imposable connue avant ajout du sursalaire
  const brut_base_imposable = params.salaire_base + anciennete + primesImpTotal;

  // K = constante de l'équation algébrique
  // NET = BRUT_FISCAL − CNPS − CMU − ITS_SAL + primes_non_imposables − autres_retenues − avances
  // ⇒ NET + CMU + autres_retenues + avances − primes_non_imposables = BRUT_FISCAL − CNPS − ITS_SAL
  const K = params.net_souhaite + cmu + autresRetenues + avances - primesNonImpTotal;

  const solution = resoudreBrutFiscal(K, ricf);

  let brut_fiscal: number;
  let tranche_its: number;

  if (solution) {
    brut_fiscal = solution.brut;
    tranche_its = solution.itsTrancheIndex;
  } else {
    // Fallback dichotomie pour les cas hors zone (rare)
    const fallback = calculerBrutDepuisNet(params.net_souhaite, autresRetenues, avances, {
      etat_civil: params.etat_civil,
      nb_enfants: params.nb_enfants,
    });
    brut_fiscal = fallback.brut;
    tranche_its = TRANCHES_ITS_LINEAIRES.findIndex(
      (t) => brut_fiscal >= t.bas && brut_fiscal < t.haut
    );
    if (tranche_its < 0) tranche_its = 0;
  }

  const sursalaire = Math.max(0, Math.round(brut_fiscal - brut_base_imposable));

  // Recalcul du bulletin complet avec le sursalaire trouvé, pour le détail
  const brut_fiscal_final = brut_base_imposable + sursalaire;
  const brut_total = brut_fiscal_final + primesNonImpTotal;
  const baseCNPS = calculerBaseCNPS(brut_fiscal_final);
  const cnps_retraite = Math.round(baseCNPS * TAUX_CNPS_RETRAITE_SALARIE);
  const its_brut = Math.round(appliquerBaremeITS(brut_fiscal_final));
  const its_salarial = Math.max(0, its_brut - ricf);
  const net_calcule =
    brut_total - cnps_retraite - cmu - its_salarial - autresRetenues - avances;

  return {
    sursalaire,
    prime_anciennete: anciennete,
    primes_imposables_total: primesImpTotal,
    primes_non_imposables_total: primesNonImpTotal,
    brut_fiscal: brut_fiscal_final,
    brut_total,
    cnps_retraite,
    cmu_salarie: cmu,
    parts_fiscales: parts,
    ricf,
    its_brut,
    its_salarial,
    net_calcule,
    tranche_its_appliquee: tranche_its,
    ecart: net_calcule - params.net_souhaite,
  };
}

// ── Indemnité de précarité (CDD) — Art. 14.8 Code du Travail ivoirien CI ─
// Taux légal : 3% de la somme brute perçue durant tout le contrat
export function calculerIndemnitePrecarite(sommeSalairesBruts: number): number {
  if (sommeSalairesBruts <= 0) return 0;
  return Math.round(sommeSalairesBruts * 0.03);
}

export interface ParametresSoldeDeCompte {
  type_contrat: 'CDD' | 'CDI';
  salaire_moyen_12_mois: number;
  somme_salaires_bruts_cdd?: number; // Requis si CDD
  anciennete_annees: number;
  jours_conges_restants: number;
  jours_preavis_non_effectues: number;
  salaire_mensuel_actuel: number; 
}

export interface ResultatSoldeDeCompte {
  indemnite_licenciement: number;
  indemnite_precarite: number;
  indemnite_compensatrice_conges: number;
  indemnite_preavis: number;
  total_brut_stc: number;
}

// ════════════════════════════════════════════════════════════════════════
// FIN DE CONTRAT — Motifs et formules métier client
// ════════════════════════════════════════════════════════════════════════
// Matrice « éléments dus » selon le motif de départ :
//   - Salaire dû / Congés payés / Gratification / Préavis / Indemnité
// Formules :
//   - Gratification     = 75 % × salaire catégoriel × (mois présence dans l'année / 12)
//   - Préavis           = SMB × nombre de mois de préavis (imposable)
//   - Indemnité fin CDD = Total des salaires bruts × 3 %
//   - Indemnité licenciement par tranche :
//       (SMB + QPG) × 30 % × min(ancien, 5)
//     + (SMB + QPG) × 35 % × max(0, min(ancien, 10) − 5)
//     + (SMB + QPG) × 40 % × max(0, ancien − 10)
//     → 50 % imposable / 50 % non imposable
//   - Indemnité de carrière (retraite) : même barème que licenciement
//   - Indemnité de décès : 12 × SMB (capital décès CCI Art. 47)
//   - Dommages-intérêts (rupture CDD avant terme) : salaires restant
//     à courir jusqu'au terme

export type MotifFinContrat =
  | 'cdd_echeance'
  | 'cdd_rupture_avant_terme'
  | 'demission'
  | 'abandon_poste'
  | 'licenciement_sante'
  | 'licenciement_insuffisance'
  | 'licenciement_aptitude'
  | 'licenciement_faute_simple'
  | 'licenciement_faute_lourde'
  | 'licenciement_economique'
  | 'retraite'
  | 'deces';

export type StatutDu = 'du' | 'sous_conditions' | 'non_du';
export type TypeIndemniteSortie =
  | 'aucune'
  | 'fin_contrat_cdd'
  | 'dommages_interets'
  | 'licenciement'
  | 'carriere'
  | 'deces';

export interface ConfigMotif {
  libelle: string;
  salaire_du: StatutDu;
  conges_payes: StatutDu;
  gratification: StatutDu;
  preavis: StatutDu;
  indemnite: TypeIndemniteSortie;
}

export const MOTIFS_FIN_CONTRAT: Record<MotifFinContrat, ConfigMotif> = {
  cdd_echeance: {
    libelle: "Fin CDD — Arrivée de l'échéance",
    salaire_du: 'du', conges_payes: 'du', gratification: 'du',
    preavis: 'non_du', indemnite: 'fin_contrat_cdd',
  },
  cdd_rupture_avant_terme: {
    libelle: 'Rupture CDD avant terme',
    salaire_du: 'du', conges_payes: 'du', gratification: 'du',
    preavis: 'non_du', indemnite: 'dommages_interets',
  },
  demission: {
    libelle: 'Démission salarié en CDI',
    salaire_du: 'du', conges_payes: 'du', gratification: 'du',
    preavis: 'sous_conditions', indemnite: 'aucune',
  },
  abandon_poste: {
    libelle: 'Abandon de poste',
    salaire_du: 'non_du', conges_payes: 'du', gratification: 'du',
    preavis: 'non_du', indemnite: 'aucune',
  },
  licenciement_sante: {
    libelle: 'Licenciement — État de santé',
    salaire_du: 'du', conges_payes: 'du', gratification: 'du',
    preavis: 'sous_conditions', indemnite: 'licenciement',
  },
  licenciement_insuffisance: {
    libelle: 'Licenciement — Insuffisance professionnelle',
    salaire_du: 'du', conges_payes: 'du', gratification: 'du',
    preavis: 'sous_conditions', indemnite: 'licenciement',
  },
  licenciement_aptitude: {
    libelle: 'Licenciement — Aptitude à tenir un emploi',
    salaire_du: 'du', conges_payes: 'du', gratification: 'du',
    preavis: 'sous_conditions', indemnite: 'licenciement',
  },
  licenciement_faute_simple: {
    libelle: 'Licenciement — Conduite fautive (faute simple)',
    salaire_du: 'du', conges_payes: 'du', gratification: 'du',
    preavis: 'sous_conditions', indemnite: 'licenciement',
  },
  licenciement_faute_lourde: {
    libelle: 'Licenciement — Conduite fautive (faute lourde)',
    salaire_du: 'non_du', conges_payes: 'du', gratification: 'du',
    preavis: 'non_du', indemnite: 'aucune',
  },
  licenciement_economique: {
    libelle: 'Licenciement — Motif économique',
    salaire_du: 'du', conges_payes: 'du', gratification: 'du',
    preavis: 'sous_conditions', indemnite: 'licenciement',
  },
  retraite: {
    libelle: 'Départ à la retraite',
    salaire_du: 'du', conges_payes: 'du', gratification: 'du',
    preavis: 'non_du', indemnite: 'carriere',
  },
  deces: {
    libelle: 'Décès du salarié',
    salaire_du: 'du', conges_payes: 'du', gratification: 'du',
    preavis: 'non_du', indemnite: 'deces',
  },
};

/**
 * Gratification (prime annuelle / 13ᵉ mois).
 * Formule : 75 % × salaire catégoriel × (mois de présence depuis le 1er janvier / 12)
 * - Prorata mensuel pour la sortie en cours d'année.
 * - Le mois de la date de fin est compté entier dès qu'il commence.
 */
export function calculerGratification(
  salaireCategoriel: number,
  dateEmbauche: string | Date | null | undefined,
  dateSortie: string | Date | null | undefined
): number {
  if (!salaireCategoriel || salaireCategoriel <= 0) return 0;
  if (!dateSortie) return 0;

  const sortie = typeof dateSortie === 'string' ? new Date(dateSortie) : dateSortie;
  if (isNaN(sortie.getTime())) return 0;

  const debutAnnee = new Date(sortie.getFullYear(), 0, 1);
  let debutPeriode = debutAnnee;

  // Si l'employé a été embauché dans l'année courante, on part de sa date d'embauche
  if (dateEmbauche) {
    const embauche = typeof dateEmbauche === 'string' ? new Date(dateEmbauche) : dateEmbauche;
    if (!isNaN(embauche.getTime()) && embauche > debutAnnee) {
      debutPeriode = embauche;
    }
  }

  // Nombre de mois entamés entre debutPeriode et sortie (inclus)
  const moisDebut = debutPeriode.getFullYear() * 12 + debutPeriode.getMonth();
  const moisFin = sortie.getFullYear() * 12 + sortie.getMonth();
  const moisPresence = Math.max(0, moisFin - moisDebut + 1);

  return Math.round(salaireCategoriel * 0.75 * moisPresence / 12);
}

/**
 * Préavis — Salaire mensuel brut × nombre de mois de préavis.
 * À intégrer dans le brut imposable du bulletin (soumis CNPS + ITS).
 */
export function calculerMontantPreavis(salaireMensuelBrut: number, nbMoisPreavis: number): number {
  if (salaireMensuelBrut <= 0 || nbMoisPreavis <= 0) return 0;
  return Math.round(salaireMensuelBrut * nbMoisPreavis);
}

/**
 * Indemnité de licenciement — barème CCI/Code du travail ivoirien :
 *   - Tranche 1 (1–5 ans)  : (SMB + QPG) × 30 % × années dans la tranche
 *   - Tranche 2 (6–10 ans) : (SMB + QPG) × 35 % × années dans la tranche
 *   - Tranche 3 (>10 ans)  : (SMB + QPG) × 40 % × années au-delà
 * QPG = quote-part de gratification mensualisée.
 *
 * Règle fiscale client : 50 % imposable / 50 % non imposable.
 */
export interface DetailIndemniteLicenciement {
  base: number;            // SMB + QPG
  tranche_1: number;       // (1–5 ans)
  tranche_2: number;       // (6–10 ans)
  tranche_3: number;       // (>10 ans)
  total: number;
  partie_imposable: number;
  partie_non_imposable: number;
}

export function calculerIndemniteLicenciementCCI(
  smb: number,
  quotePartGratification: number,
  anneesAnciennete: number
): DetailIndemniteLicenciement {
  const base = Math.max(0, smb + quotePartGratification);
  if (anneesAnciennete < 1 || base <= 0) {
    return { base, tranche_1: 0, tranche_2: 0, tranche_3: 0, total: 0, partie_imposable: 0, partie_non_imposable: 0 };
  }

  const a1 = Math.min(anneesAnciennete, 5);
  const a2 = Math.max(0, Math.min(anneesAnciennete, 10) - 5);
  const a3 = Math.max(0, anneesAnciennete - 10);

  const tranche_1 = Math.round(base * 0.30 * a1);
  const tranche_2 = Math.round(base * 0.35 * a2);
  const tranche_3 = Math.round(base * 0.40 * a3);
  const total = tranche_1 + tranche_2 + tranche_3;

  const partie_imposable = Math.round(total * 0.5);
  const partie_non_imposable = total - partie_imposable;

  return { base, tranche_1, tranche_2, tranche_3, total, partie_imposable, partie_non_imposable };
}

/**
 * Indemnité de carrière — même barème que licenciement (départ retraite).
 * Plafond CGI : 25 × SMIG annuel = 25 × 12 × SMIG.
 */
export function calculerIndemniteCarriere(
  smb: number,
  quotePartGratification: number,
  anneesAnciennete: number
): DetailIndemniteLicenciement {
  const detail = calculerIndemniteLicenciementCCI(smb, quotePartGratification, anneesAnciennete);
  const plafond = 25 * 12 * SMIG_MENSUEL;
  if (detail.total > plafond) {
    const total = plafond;
    const partie_imposable = Math.round(total * 0.5);
    const partie_non_imposable = total - partie_imposable;
    return { ...detail, total, partie_imposable, partie_non_imposable };
  }
  return detail;
}

/**
 * Indemnité de décès — capital décès (CCI Art. 47).
 * Référence : 12 × SMB versé aux ayants-droit.
 * La participation aux frais funéraires est négociée au cas par cas
 * et ajoutée séparément via `fraisFuneraires`.
 */
export function calculerIndemniteDeces(smb: number, fraisFuneraires = 0): number {
  const capital = Math.max(0, smb) * 12;
  return Math.round(capital + Math.max(0, fraisFuneraires));
}

/**
 * Dommages-intérêts pour rupture CDD avant terme.
 * Référence Art. 14.7 Code du travail ivoirien : salaires que le salarié
 * aurait perçus jusqu'au terme du contrat.
 */
export function calculerDommagesInteretsCDD(
  smb: number,
  nbMoisRestants: number
): number {
  if (smb <= 0 || nbMoisRestants <= 0) return 0;
  return Math.round(smb * nbMoisRestants);
}

export interface ParametresSoldeDeCompteMotif {
  motif: MotifFinContrat;
  salaire_mensuel_brut: number;            // SMB
  salaire_categoriel: number;              // Salaire de base (pour gratification)
  date_embauche: string;                   // Pour ancienneté / prorata gratif
  date_sortie: string;                     // Date dernier jour
  anciennete_annees: number;               // Calculée (peut différer de today - date_embauche)
  jours_conges_restants: number;
  nb_mois_preavis?: number;                // Préavis selon catégorie
  somme_salaires_bruts_cdd?: number;       // Pour indemnité fin CDD
  nb_mois_restants_cdd?: number;           // Pour dommages-intérêts rupture CDD
  frais_funeraires?: number;               // Pour décès uniquement
}

export interface ResultatSoldeDeCompteMotif {
  motif: MotifFinContrat;
  libelle_motif: string;
  // Éléments dus (0 si non applicable)
  salaire_du: number;
  conges_payes: number;
  gratification: number;
  preavis: number;
  indemnite_montant: number;
  indemnite_type: TypeIndemniteSortie;
  indemnite_libelle: string;
  // Ventilation fiscale
  total_brut: number;
  partie_imposable: number;            // Soumis CNPS + ITS
  partie_non_imposable: number;        // Exonérée, ajoutée au net
  // Détails
  detail_indemnite?: DetailIndemniteLicenciement;
}

const LIBELLES_INDEMNITE: Record<TypeIndemniteSortie, string> = {
  aucune: 'Aucune indemnité',
  fin_contrat_cdd: 'Indemnité de fin de contrat (CDD)',
  dommages_interets: 'Dommages et intérêts',
  licenciement: 'Indemnité de licenciement',
  carriere: 'Indemnité de carrière (retraite)',
  deces: 'Indemnité de décès + frais funéraires',
};

export function calculerSoldeDeCompteMotif(
  params: ParametresSoldeDeCompteMotif
): ResultatSoldeDeCompteMotif {
  const config = MOTIFS_FIN_CONTRAT[params.motif];
  if (!config) {
    throw new Error(`Motif de fin de contrat inconnu : ${params.motif}`);
  }

  // ── 1. Gratification (quote-part annuelle prorata temporis)
  const gratification = config.gratification === 'non_du'
    ? 0
    : calculerGratification(params.salaire_categoriel, params.date_embauche, params.date_sortie);

  // QPG mensualisée pour la base d'indemnité
  const qpg_mensuelle = Math.round(params.salaire_categoriel * 0.75 / 12);

  // ── 2. Salaire dû (mois en cours) — non versé si abandon ou faute lourde
  const salaire_du = config.salaire_du === 'non_du' ? 0 : params.salaire_mensuel_brut;

  // ── 3. Congés payés — toujours dus sauf "non_du"
  const conges_payes = config.conges_payes === 'non_du'
    ? 0
    : calculerICCP(params.jours_conges_restants ?? 0, params.salaire_mensuel_brut);

  // ── 4. Préavis — dû seulement si "du" ou "sous_conditions"
  const preavis = config.preavis === 'non_du'
    ? 0
    : calculerMontantPreavis(params.salaire_mensuel_brut, params.nb_mois_preavis ?? 0);

  // ── 5. Indemnité spécifique au motif
  let indemnite_montant = 0;
  let detail_indemnite: DetailIndemniteLicenciement | undefined;
  let indemnite_imposable = 0;
  let indemnite_non_imposable = 0;

  switch (config.indemnite) {
    case 'fin_contrat_cdd':
      indemnite_montant = calculerIndemnitePrecarite(params.somme_salaires_bruts_cdd ?? 0);
      indemnite_non_imposable = indemnite_montant; // Indemnité précarité : exonérée
      break;
    case 'dommages_interets':
      indemnite_montant = calculerDommagesInteretsCDD(
        params.salaire_mensuel_brut,
        params.nb_mois_restants_cdd ?? 0
      );
      indemnite_non_imposable = indemnite_montant; // D&I : exonérés
      break;
    case 'licenciement':
      detail_indemnite = calculerIndemniteLicenciementCCI(
        params.salaire_mensuel_brut,
        qpg_mensuelle,
        params.anciennete_annees
      );
      indemnite_montant = detail_indemnite.total;
      indemnite_imposable = detail_indemnite.partie_imposable;
      indemnite_non_imposable = detail_indemnite.partie_non_imposable;
      break;
    case 'carriere':
      detail_indemnite = calculerIndemniteCarriere(
        params.salaire_mensuel_brut,
        qpg_mensuelle,
        params.anciennete_annees
      );
      indemnite_montant = detail_indemnite.total;
      indemnite_imposable = detail_indemnite.partie_imposable;
      indemnite_non_imposable = detail_indemnite.partie_non_imposable;
      break;
    case 'deces':
      indemnite_montant = calculerIndemniteDeces(
        params.salaire_mensuel_brut,
        params.frais_funeraires ?? 0
      );
      indemnite_non_imposable = indemnite_montant; // Capital décès : exonéré
      break;
    case 'aucune':
    default:
      // Rien à verser
      break;
  }

  // Salaire dû, gratif, congés payés et préavis = imposables (entrent dans le brut)
  const partie_imposable_courante = salaire_du + gratification + preavis + indemnite_imposable;
  const partie_non_imposable_courante = conges_payes + indemnite_non_imposable;

  const total_brut =
    salaire_du + conges_payes + gratification + preavis + indemnite_montant;

  return {
    motif: params.motif,
    libelle_motif: config.libelle,
    salaire_du,
    conges_payes,
    gratification,
    preavis,
    indemnite_montant,
    indemnite_type: config.indemnite,
    indemnite_libelle: LIBELLES_INDEMNITE[config.indemnite],
    total_brut,
    partie_imposable: partie_imposable_courante,
    partie_non_imposable: partie_non_imposable_courante,
    detail_indemnite,
  };
}

// ════════════════════════════════════════════════════════════════════════
// Ancienne API — conservée pour rétro-compatibilité
// ════════════════════════════════════════════════════════════════════════
export function calculerSoldeDeCompte(params: ParametresSoldeDeCompte): ResultatSoldeDeCompte {
  let indemnite_licenciement = 0;
  let indemnite_precarite = 0;

  if (params.type_contrat === 'CDI') {
    indemnite_licenciement = calculerIndemniteLicenciement(
      params.salaire_moyen_12_mois, 
      params.anciennete_annees
    );
  } else if (params.type_contrat === 'CDD') {
    indemnite_precarite = calculerIndemnitePrecarite(
      params.somme_salaires_bruts_cdd || 0
    );
  }

  // ICCP (Indemnité Compensatrice de Congés Payés)
  // Art. 25 Code du Travail ivoirien CI — taux journalier : salaire / 26 jours ouvrables
  const indemnite_compensatrice_conges = calculerICCP(
    params.jours_conges_restants,
    params.salaire_mensuel_actuel
  );

  // Indemnité de préavis — taux journalier : salaire / 26 jours ouvrables (praticien CI)
  const indemnite_preavis = Math.round(
    (params.salaire_mensuel_actuel / 26) * params.jours_preavis_non_effectues
  );

  const total_brut_stc = 
    indemnite_licenciement + 
    indemnite_precarite + 
    indemnite_compensatrice_conges + 
    indemnite_preavis;

  return {
    indemnite_licenciement,
    indemnite_precarite,
    indemnite_compensatrice_conges,
    indemnite_preavis,
    total_brut_stc
  };
}
