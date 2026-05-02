/**
 * lib/compliance-2026-ci.ts
 *
 * Référentiel des obligations sociales et fiscales — Côte d'Ivoire — Réforme 2026.
 *
 * Sources :
 *  - Code de Prévoyance Sociale (Loi 99-477 modifiée 2025)
 *  - Code Général des Impôts CI Art. 116 (Réforme ITS 2024-2026)
 *  - Décret 2022-986 (SMIG 75 000 FCFA)
 *  - Arrêté n° 2008-2401 (mentions bulletin)
 *
 * Ce fichier centralise :
 *   1. Les taux 2026 utilisés pour générer les déclarations sociales et fiscales
 *   2. Les générateurs de fichiers DIPE / DISA / ITS au format CSV (E-CNPS / DGI)
 *   3. Le calcul des pénalités de retard
 *   4. Le calendrier des échéances 2026
 */

// ── Taux & plafonds — Réforme 2026 ──────────────────────────────────────────

export const REFORME_2026 = {
  // CNPS — Code de Prévoyance Sociale
  cnps: {
    retraite_salarie: 0.063,       // 6,3 % salarial (inclut maladie cadre)
    retraite_patronal: 0.077,      // 7,7 % patronal
    familiales_patronal: 0.0575,   // 5,75 % patronal — sans plafond
    maternite_patronal: 0.0075,    // 0,75 % patronal — sans plafond
    at_mp_patronal_min: 0.02,      // 2 % minimum (variable secteur)
    at_mp_patronal_max: 0.05,      // 5 % maximum
    at_mp_patronal_default: 0.03,
    plafond_mensuel: 3_375_000,    // 45 × SMIG 75 000 (réforme 2025)
    plafond_legacy: 1_647_315,     // ancien plafond (à supprimer après migration complète)
    cmu_forfait_mensuel: 1_600,    // CMU forfaitaire — part salariale = part patronale
  },
  // FDFP & Apprentissage
  fdfp: {
    formation: 0.012,         // 1,2 %
    apprentissage: 0.004,     // 0,4 %
  },
  // Fiscal — réforme ITS Art. 116 CGI 2024
  its: {
    abattement_forfaitaire: 0.20, // 20 % réforme 2024
    contribution_nationale: 0.015,
    bareme: [
      { limite: 75_000,    taux: 0    },
      { limite: 240_000,   taux: 0.16 },
      { limite: 800_000,   taux: 0.21 },
      { limite: 2_400_000, taux: 0.24 },
      { limite: 8_000_000, taux: 0.28 },
      { limite: Infinity,  taux: 0.32 },
    ],
  },
  // SMIG mensuel
  smig_mensuel: 75_000,
} as const;

// ── Calendrier 2026 — échéances clés ────────────────────────────────────────

export type DeadlineRule =
  | { type: "monthly"; day: number; description: string }
  | { type: "annual"; month: number; day: number; description: string };

/**
 * Le 15 du mois suivant pour le DIPE et l'ITS.
 * Le 31 mars pour DISA, DASC et état annuel ITS.
 */
export const ECHEANCES_2026: Record<string, DeadlineRule> = {
  DIPE: {
    type: "monthly",
    day: 15,
    description: "Déclaration Individuelle de Paie Employeur — soumission E-CNPS le 15 du mois suivant",
  },
  ITS_MENSUEL: {
    type: "monthly",
    day: 15,
    description: "Versement ITS — bordereau DGI le 15 du mois suivant",
  },
  IGR_MENSUEL: {
    type: "monthly",
    day: 15,
    description: "IGR retenue à la source — bordereau DGI le 15 du mois suivant",
  },
  CN_MENSUEL: {
    type: "monthly",
    day: 15,
    description: "Contribution Nationale — bordereau DGI le 15 du mois suivant",
  },
  DISA: {
    type: "annual",
    month: 3,
    day: 31,
    description: "Déclaration Individuelle des Salaires Annuels — CNPS au 31 mars",
  },
  DASC: {
    type: "annual",
    month: 3,
    day: 31,
    description: "Déclaration Annuelle des Salaires et Cotisations — CNPS au 31 mars",
  },
  ITS_ANNUEL: {
    type: "annual",
    month: 3,
    day: 31,
    description: "État annuel ITS — DGI au 31 mars",
  },
};

/**
 * Calcule la date d'échéance pour une période donnée.
 * - DIPE/ITS_MENSUEL : 15 du mois M+1
 * - DISA/DASC/ITS_ANNUEL : 31 mars de l'année suivante
 */
export function computeDeadline(kind: keyof typeof ECHEANCES_2026, periode: string): Date {
  const rule = ECHEANCES_2026[kind];
  if (rule.type === "monthly") {
    // periode "YYYY-MM" → deadline = M+1, day=15
    const [y, m] = periode.split("-").map((s) => parseInt(s, 10));
    const next = new Date(y, m, rule.day); // mois 0-indexé : m+1−1 = m
    return next;
  }
  // annual : periode "YYYY" → deadline = (YYYY+1)-month-day
  const y = parseInt(periode, 10);
  return new Date(y + 1, rule.month - 1, rule.day);
}

// ── Pénalité de retard CNPS ─────────────────────────────────────────────────

/**
 * Majoration de retard CNPS — Art. 47 Code de Prévoyance Sociale.
 * Base : 5 % du dû dès le 1er jour de retard, + 1 % par mois supplémentaire.
 */
export function computePenaltyCnps(montantDu: number, deadline: Date, today: Date = new Date()): number {
  if (today <= deadline) return 0;
  const diffMs = today.getTime() - deadline.getTime();
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  const taux = 0.05 + 0.01 * diffMonths;
  return Math.round(montantDu * taux);
}

// ── Génération CSV — DIPE (mensuel CNPS) ────────────────────────────────────

export interface DipeLigneSalarie {
  matricule: string;
  num_cnps: string | null;
  full_name: string;
  salaire_brut: number;
  salaire_imposable: number;
  base_cnps: number;
  cnps_retraite_salarie: number;
  cnps_retraite_patronal: number;
  cnps_familiales: number;
  cnps_maternite: number;
  cnps_at_mp: number;
  cmu_salarie: number;
  cmu_patronal: number;
}

export interface DipePayload {
  periode: string; // YYYY-MM
  numero_cnps_employeur: string | null;
  raison_sociale: string;
  ncc: string | null;
  lignes: DipeLigneSalarie[];
}

/**
 * Génère un fichier CSV compatible E-CNPS pour le DIPE mensuel.
 * Le séparateur ";" est celui attendu par l'import E-CNPS.
 */
export function generateDipeCsv(payload: DipePayload): string {
  const headers = [
    "Matricule",
    "N_CNPS_Salarie",
    "Nom_Prenoms",
    "Salaire_Brut",
    "Salaire_Imposable",
    "Base_CNPS",
    "CNPS_Retraite_Salarie",
    "CNPS_Retraite_Patronal",
    "CNPS_Familiales",
    "CNPS_Maternite",
    "CNPS_AT_MP",
    "CMU_Salarie",
    "CMU_Patronal",
  ];
  const lines = [headers.join(";")];
  for (const l of payload.lignes) {
    lines.push(
      [
        escapeCsv(l.matricule),
        escapeCsv(l.num_cnps ?? ""),
        escapeCsv(l.full_name),
        l.salaire_brut.toFixed(0),
        l.salaire_imposable.toFixed(0),
        l.base_cnps.toFixed(0),
        l.cnps_retraite_salarie.toFixed(0),
        l.cnps_retraite_patronal.toFixed(0),
        l.cnps_familiales.toFixed(0),
        l.cnps_maternite.toFixed(0),
        l.cnps_at_mp.toFixed(0),
        l.cmu_salarie.toFixed(0),
        l.cmu_patronal.toFixed(0),
      ].join(";")
    );
  }
  // Ligne de totaux
  const totals = payload.lignes.reduce(
    (acc, l) => ({
      brut: acc.brut + l.salaire_brut,
      retraite_sal: acc.retraite_sal + l.cnps_retraite_salarie,
      retraite_pat: acc.retraite_pat + l.cnps_retraite_patronal,
      familiales: acc.familiales + l.cnps_familiales,
      maternite: acc.maternite + l.cnps_maternite,
      at_mp: acc.at_mp + l.cnps_at_mp,
      cmu_sal: acc.cmu_sal + l.cmu_salarie,
      cmu_pat: acc.cmu_pat + l.cmu_patronal,
    }),
    { brut: 0, retraite_sal: 0, retraite_pat: 0, familiales: 0, maternite: 0, at_mp: 0, cmu_sal: 0, cmu_pat: 0 }
  );
  lines.push(""); // séparateur
  lines.push(["#", "TOTAUX", "", totals.brut.toFixed(0), "", "",
    totals.retraite_sal.toFixed(0),
    totals.retraite_pat.toFixed(0),
    totals.familiales.toFixed(0),
    totals.maternite.toFixed(0),
    totals.at_mp.toFixed(0),
    totals.cmu_sal.toFixed(0),
    totals.cmu_pat.toFixed(0),
  ].join(";"));
  lines.push(`#;Periode;${payload.periode};Employeur;${escapeCsv(payload.raison_sociale)};NCNPS;${escapeCsv(payload.numero_cnps_employeur ?? "")};NCC;${escapeCsv(payload.ncc ?? "")}`);
  return lines.join("\n");
}

// ── Génération CSV — DISA (annuel CNPS) ─────────────────────────────────────

export interface DisaLigneSalarie {
  matricule: string;
  num_cnps: string | null;
  full_name: string;
  date_naissance: string | null;
  date_embauche: string | null;
  date_sortie: string | null;
  total_brut_annuel: number;
  total_cnps_salarie: number;
  total_cnps_patronal: number;
  jours_travailles: number;
}

export interface DisaPayload {
  annee: string;
  numero_cnps_employeur: string | null;
  raison_sociale: string;
  ncc: string | null;
  lignes: DisaLigneSalarie[];
}

export function generateDisaCsv(payload: DisaPayload): string {
  const headers = [
    "Matricule",
    "N_CNPS_Salarie",
    "Nom_Prenoms",
    "Date_Naissance",
    "Date_Embauche",
    "Date_Sortie",
    "Total_Brut_Annuel",
    "Total_CNPS_Salarie",
    "Total_CNPS_Patronal",
    "Jours_Travailles",
  ];
  const lines = [headers.join(";")];
  for (const l of payload.lignes) {
    lines.push(
      [
        escapeCsv(l.matricule),
        escapeCsv(l.num_cnps ?? ""),
        escapeCsv(l.full_name),
        l.date_naissance ?? "",
        l.date_embauche ?? "",
        l.date_sortie ?? "",
        l.total_brut_annuel.toFixed(0),
        l.total_cnps_salarie.toFixed(0),
        l.total_cnps_patronal.toFixed(0),
        l.jours_travailles.toString(),
      ].join(";")
    );
  }
  lines.push("");
  lines.push(`#;Annee;${payload.annee};Employeur;${escapeCsv(payload.raison_sociale)};NCNPS;${escapeCsv(payload.numero_cnps_employeur ?? "")};NCC;${escapeCsv(payload.ncc ?? "")}`);
  return lines.join("\n");
}

// ── Génération CSV — État ITS / DGI ─────────────────────────────────────────

export interface ItsLigneSalarie {
  matricule: string;
  full_name: string;
  ncc_employe: string | null;
  brut_imposable: number;
  abattement: number;          // 20 % réforme 2024
  base_imposable: number;      // après CNPS et abattement
  its: number;
  contribution_nationale: number;
}

export interface ItsPayload {
  periode: string; // YYYY-MM
  ncc_employeur: string | null;
  raison_sociale: string;
  lignes: ItsLigneSalarie[];
}

export function generateItsCsv(payload: ItsPayload): string {
  const headers = [
    "Matricule",
    "Nom_Prenoms",
    "NCC_Employe",
    "Brut_Imposable",
    "Abattement_20pct",
    "Base_Imposable",
    "ITS",
    "Contribution_Nationale_1_5pct",
  ];
  const lines = [headers.join(";")];
  for (const l of payload.lignes) {
    lines.push(
      [
        escapeCsv(l.matricule),
        escapeCsv(l.full_name),
        escapeCsv(l.ncc_employe ?? ""),
        l.brut_imposable.toFixed(0),
        l.abattement.toFixed(0),
        l.base_imposable.toFixed(0),
        l.its.toFixed(0),
        l.contribution_nationale.toFixed(0),
      ].join(";")
    );
  }
  const totals = payload.lignes.reduce(
    (acc, l) => ({
      its: acc.its + l.its,
      cn: acc.cn + l.contribution_nationale,
    }),
    { its: 0, cn: 0 }
  );
  lines.push("");
  lines.push(`#;TOTAL_ITS;${totals.its.toFixed(0)};TOTAL_CN;${totals.cn.toFixed(0)}`);
  lines.push(`#;Periode;${payload.periode};Employeur;${escapeCsv(payload.raison_sociale)};NCC;${escapeCsv(payload.ncc_employeur ?? "")}`);
  return lines.join("\n");
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function escapeCsv(val: string): string {
  if (val == null) return "";
  const v = String(val);
  if (v.includes(";") || v.includes("\"") || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

/**
 * Conversion d'un montant total et de sa déduction CNPS en un objet
 * lignes ITS calculées (réforme 2026).
 */
export function buildItsLineFromBulletin(args: {
  matricule: string;
  full_name: string;
  ncc_employe: string | null;
  brut_imposable: number; // après transport / logement / vacances
  cnps_retraite: number;
}): ItsLigneSalarie {
  const apresCnps = Math.max(0, args.brut_imposable - args.cnps_retraite);
  const abattement = Math.round(apresCnps * REFORME_2026.its.abattement_forfaitaire);
  const base_imposable = Math.max(0, apresCnps - abattement);
  // Application du barème
  let its = 0;
  let reste = base_imposable;
  let precedente = 0;
  for (const tranche of REFORME_2026.its.bareme) {
    if (reste <= 0) break;
    const seg = Math.min(reste, tranche.limite - precedente);
    its += seg * tranche.taux;
    reste -= seg;
    precedente = tranche.limite;
  }
  const cn = Math.round(args.brut_imposable * REFORME_2026.its.contribution_nationale);
  return {
    matricule: args.matricule,
    full_name: args.full_name,
    ncc_employe: args.ncc_employe,
    brut_imposable: args.brut_imposable,
    abattement,
    base_imposable,
    its: Math.round(its),
    contribution_nationale: cn,
  };
}
