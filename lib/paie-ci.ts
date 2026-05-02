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

// CNPS retraite salariale : 6,30% plafonné à 45 fois le SMIG (45 x 75 000 = 3 375 000 FCFA/mois)
export const TAUX_CNPS_RETRAITE_SALARIE = 0.063;
export const PLAFOND_CNPS_MENSUEL = 3_375_000;
// Alias compatibilité descendante
export const TAUX_CNPS_SALARIE = TAUX_CNPS_RETRAITE_SALARIE;
export const PLAFOND_CNPS = PLAFOND_CNPS_MENSUEL;

// CMU (CNAM) — Couverture Maladie Universelle
// Forfait mensuel 1 600 FCFA — part salariale = part patronale
export const CMU_MENSUEL = 1_600;

export const TAUX_ABATTEMENT_ITS = 0.15;

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
 * Calcul ITS (Impôt sur Traitement et Salaires) — Barème CI simplifié mensuel
 * Base imposable = brut - CNPS salarié - abattement forfaitaire
 * ⚠️ Barème ITS non détaillé dans le CT-CI 2025 (seule l'obligation de retenue est mentionnée)
 * Barème ci-dessous = barème CGI CI Art. 116 — À vérifier chaque Loi de Finances
 */
export function calculerITS(salaireImposable: number): number {
  if (salaireImposable <= 0) return 0;

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
  cnps_retraite: number;            // 6,3% plafonné
  cmu_salarie: number;              // CMU forfait 1 600 FCFA
  cnps_salarie: number;             // Total salarial : cnps_retraite + cmu_salarie
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
  // CNPS retraite salariale (6,3% plafonné)
  const baseCNPS = Math.min(salaireBrut, PLAFOND_CNPS_MENSUEL);
  const cnps_retraite = Math.round(baseCNPS * TAUX_CNPS_RETRAITE_SALARIE);

  // CMU salariale — forfait
  const cmu_salarie = CMU_MENSUEL;

  // Total retenu salarié
  const cnps_salarie = cnps_retraite + cmu_salarie;

  // Base imposable ITS = (brut - CNPS retraite) - abattement 15% (CGI CI)
  const baseImposableApresCnps = Math.max(0, salaireBrut - cnps_retraite);
  const base_imposable = Math.max(0, Math.round(baseImposableApresCnps * (1 - TAUX_ABATTEMENT_ITS)));
  const its = calculerITS(base_imposable);

  const salaire_net_avant_retenues = salaireBrut - cnps_salarie - its;
  const salaire_net = salaire_net_avant_retenues - autresRetenues - avances;

  return {
    salaire_brut: salaireBrut,
    cnps_retraite,
    cmu_salarie,
    cnps_salarie,
    base_imposable,
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

export function calculerChargesPatronales(salaireBrut: number, tauxAtMp: number = CHARGES_PATRONALES_TAUX.at_mp): ChargesPatronales {
  const familiales = Math.round(salaireBrut * CHARGES_PATRONALES_TAUX.familiales);

  const maternite = Math.round(salaireBrut * CHARGES_PATRONALES_TAUX.maternite);

  const baseRetraite = Math.min(salaireBrut, PLAFOND_CNPS_MENSUEL);
  const retraite = Math.round(baseRetraite * CHARGES_PATRONALES_TAUX.retraite);

  // Le taux AT/MP peut varier d'une entreprise à l'autre (généralement entre 2% et 5%)
  const at_mp = Math.round(salaireBrut * tauxAtMp);

  const cmu = CMU_MENSUEL;

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
// Taux : 1% du salaire catégoriel par année d'ancienneté révolue
// Plafond : 25% (atteint après 25 ans de présence)
// Source : Convention Collective Interprofessionnelle CI
export function calculerPrimeAnciennete(salaireCat: number, dateEmbauche: string | null | undefined, convention: string = 'Interprofessionnelle'): number {
  if (!dateEmbauche) return 0;
  const debut = new Date(dateEmbauche);
  if (isNaN(debut.getTime())) return 0;
  
  const now = new Date();
  // Années complètes de service
  let annees = now.getFullYear() - debut.getFullYear();
  const moisPasse = now.getMonth() > debut.getMonth()
    || (now.getMonth() === debut.getMonth() && now.getDate() >= debut.getDate());
  if (!moisPasse) annees -= 1;
  if (annees <= 0) return 0;
  
  let taux = 0;
  
  if (convention === 'BTP') {
    // Exemple BTP : taux limité à 20%
    taux = Math.min(annees * 0.01, 0.20);
  } else if (convention === 'Commerce') {
    // Exemple Commerce
    taux = Math.min(annees * 0.01, 0.25);
  } else {
    // CCI Interprofessionnelle par défaut : 1% par an, max 25%
    taux = Math.min(annees * 0.01, 0.25);
  }

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

export function calculerHeuresSup(nbH15: number, nbH50: number, nbH75: number, tauxHoraire: number): number {
  const h15 = nbH15 * tauxHoraire * 1.15;
  const h50 = nbH50 * tauxHoraire * 1.50;
  const h75 = nbH75 * tauxHoraire * 1.75;
  return Math.round(h15 + h50 + h75);
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

export interface LignesBulletin {
  salaire_brut: number;
  sursalaire?: number;
  prime_anciennete?: number;
  prime_exceptionnelle?: number;
  prime_salissure?: number;
  prime_depassement?: number;
  prime_fonction?: number;
  prime_transport?: number;
  vacation_allowance?: number;     // Indemnité congés payés (Sage) — exonérée
  prime_logement?: number;         // Prime de logement — exonérée CI
  prime_responsabilite?: number;   // Prime de responsabilité — imposable
  remboursement_frais?: number;    // Remboursement de frais — exonéré
  heures_normales?: number;        // Heures normales du mois (affichage bulletin)
  heures_sup?: {
    h15: number;
    h50: number;
    h75: number;
  };
  taux_horaire?: number;
  autres_retenues?: number;
  avances?: number;
  nb_jours_absence?: number;
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
    ? calculerHeuresSup(lignes.heures_sup.h15, lignes.heures_sup.h50, lignes.heures_sup.h75, taux_horaire)
    : 0;

  const total_brut = (lignes.salaire_brut ?? 0)
    + (lignes.sursalaire ?? 0)
    + (lignes.prime_anciennete ?? 0)
    + (lignes.prime_exceptionnelle ?? 0)
    + (lignes.prime_salissure ?? 0)
    + (lignes.prime_depassement ?? 0)
    + (lignes.prime_fonction ?? 0)
    + primeResponsabilite
    + heures_sup_montant
    + primeTransport
    + vacationAllowance
    + primeLogement
    + remboursementFrais;

  // Éléments non soumis à ITS : transport + congés payés + logement + remboursements
  const total_imposable = Math.max(0, total_brut - primeTransport - vacationAllowance - primeLogement - remboursementFrais);

  // CNPS plafonné
  const base_cnps = Math.min(total_imposable, PLAFOND_CNPS_MENSUEL);
  const cnps_retraite = Math.round(base_cnps * TAUX_CNPS_RETRAITE_SALARIE);

  // CMU forfait
  const cmu = CMU_MENSUEL;

  // ITS : abattement sur base imposable après CNPS
  const base_its = Math.max(0, total_imposable - cnps_retraite);
  const base_its_apres_abattement = Math.max(0, Math.round(base_its * (1 - TAUX_ABATTEMENT_ITS)));
  const its = calculerITS(base_its_apres_abattement);

  const retenu_absence = calculerRetenuAbsence(lignes.nb_jours_absence ?? 0, lignes.salaire_brut);

  const cnps_salarie = cnps_retraite + cmu;

  const total_retenues = cnps_salarie + its
    + (lignes.autres_retenues ?? 0)
    + (lignes.avances ?? 0)
    + retenu_absence;

  const salaire_net = Math.max(0, total_brut - total_retenues);

  // Colonnes Sage
  const exempt_indemnity = primeTransport + vacationAllowance + primeLogement + remboursementFrais;
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
  };
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
