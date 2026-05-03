/**
 * lib/heures-sup-import.ts
 * ─────────────────────────────────────────────────────────────
 * Parseur et validateur du fichier Excel d'import des heures
 * supplémentaires (Phase 02-07).
 *
 * Compatible avec overtime_records (category / hours_count).
 * Pour chaque palier non-nul une ligne sera insérée dans
 * overtime_records avec la catégorie correspondante.
 *
 * Paliers légaux (Décret n°96-203 / Art. 24 CT-CI) :
 *   h15  → +15%  (heures semaine 41–48, factor 1.15)
 *   h50  → +50%  (au-delà 48h ou heures de nuit, factor 1.50)
 *   h75  → +75%  (dimanche / férié, factor 1.75)
 *   h100 → +100% (cas exceptionnel accord entreprise, factor 2.00)
 */

import ExcelJS from "exceljs";

// ── Constantes ────────────────────────────────────────────────────────────────

export const HEURES_MENSUELLES = 173.33;

export const MAJORATIONS: Record<string, number> = {
  "15%":  1.15,
  "50%":  1.50,
  "75%":  1.75,
  "100%": 2.00,
};

/** Colonnes obligatoires dans le template Excel */
export const REQUIRED_COLUMNS_HS = [
  "matricule",
  "periode",
  "h15",
  "h50",
  "h75",
  "h100",
] as const;

export const MAX_ROWS = 1000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LigneImportHS {
  matricule: string;
  nom_complet?: string;
  periode: string;       // YYYY-MM
  h15: number;
  h50: number;
  h75: number;
  h100: number;          // +100% — exceptionnel (nuit dimanche/férié cumulé)
  commentaire?: string;
}

export interface LigneValideeHS extends LigneImportHS {
  employee_id: string;
  salaire_brut: number;
  taux_horaire: number;
  montant_calcule: number;
}

export interface ParseResult {
  lignes: LigneImportHS[];
  erreurs: string[];
}

export interface ValidationResult {
  valides: LigneValideeHS[];
  erreurs: string[];        // erreurs bloquantes
  avertissements: string[]; // non-bloquants
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Nettoie les espaces insécables et trim */
function cleanStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).replace(/\u00A0/g, " ").trim();
}

/** Parse un nombre depuis une cellule Excel (string, number, null) */
function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

/**
 * Calcule le montant imputable pour un palier.
 * montant = taux_horaire × facteur_majoration × heures
 */
export function calculerMontantPalier(
  tauxHoraire: number,
  categorie: keyof typeof MAJORATIONS,
  heures: number,
): number {
  const factor = MAJORATIONS[categorie] ?? 1;
  return Math.round(tauxHoraire * factor * heures);
}

/**
 * Calcule le montant total heures supplémentaires pour une ligne.
 * Somme sur les 4 paliers.
 */
export function calculerMontantTotal(ligne: LigneImportHS, tauxHoraire: number): number {
  return (
    calculerMontantPalier(tauxHoraire, "15%",  ligne.h15)  +
    calculerMontantPalier(tauxHoraire, "50%",  ligne.h50)  +
    calculerMontantPalier(tauxHoraire, "75%",  ligne.h75)  +
    calculerMontantPalier(tauxHoraire, "100%", ligne.h100)
  );
}

// ── Parseur Excel ─────────────────────────────────────────────────────────────

/**
 * Lit un buffer Excel (.xlsx) et retourne les lignes du premier onglet.
 * Gère : colonnes manquantes, espaces insécables, valeurs non-numériques.
 */
export async function parseExcelHS(input: Buffer | ArrayBuffer): Promise<ParseResult> {
  const erreurs: string[] = [];
  const lignes: LigneImportHS[] = [];

  // Normalise en ArrayBuffer pur pour éviter les problèmes de génériques Node 24
  const arrayBuf: ArrayBuffer = input instanceof ArrayBuffer
    ? input
    : input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;

  const workbook = new ExcelJS.Workbook();
  try {
    // @ts-ignore — ExcelJS accepte ArrayBuffer en pratique mais son type ne le déclare pas
    await workbook.xlsx.load(arrayBuf);
  } catch {
    return { lignes: [], erreurs: ["Fichier illisible — vérifiez le format (.xlsx requis)."] };
  }

  // Cherche l'onglet "Template" en priorité, sinon le premier
  const sheet =
    workbook.getWorksheet("Template") ??
    workbook.getWorksheet("Données") ??
    workbook.worksheets[0];

  if (!sheet) {
    return { lignes: [], erreurs: ["Le fichier Excel ne contient aucun onglet."] };
  }

  // Lire les en-têtes de la ligne 1
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    const rawVal = cleanStr(cell.value).toLowerCase().replace(/\*/g, "");
    headers.push(rawVal.trim().replace(/\s+/g, "_"));
  });

  // Vérifier colonnes obligatoires
  const missing = REQUIRED_COLUMNS_HS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    return {
      lignes: [],
      erreurs: [`Colonnes manquantes dans le fichier : ${missing.join(", ")}`],
    };
  }

  if (sheet.rowCount - 1 > MAX_ROWS) {
    return {
      lignes: [],
      erreurs: [`Trop de lignes : max ${MAX_ROWS} (reçu ~${sheet.rowCount - 1}).`],
    };
  }

  const colIdx = (name: string) => headers.indexOf(name);

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= 2) return; // skip header and subtitle rows

    const get = (col: string) => {
      const idx = colIdx(col);
      if (idx < 0) return null;
      const cell = row.getCell(idx + 1);
      return cell.value;
    };

    const matricule = cleanStr(get("matricule"));
    const periode   = cleanStr(get("periode"));
    if (!matricule && !periode) return; // ligne vide → skip silencieux

    const nom_complet  = cleanStr(get("nom_complet"));
    const h15v         = parseNum(get("h15"));
    const h50v         = parseNum(get("h50"));
    const h75v         = parseNum(get("h75"));
    const h100v        = parseNum(get("h100"));
    const commentaire  = cleanStr(get("commentaire"));

    // Valider les nombres
    if ([h15v, h50v, h75v, h100v].some((n) => isNaN(n))) {
      erreurs.push(`Ligne ${rowNumber} (${matricule || "?"}) : valeurs d'heures non numériques.`);
      return;
    }

    lignes.push({ matricule, nom_complet, periode, h15: h15v, h50: h50v, h75: h75v, h100: h100v, commentaire });
  });

  return { lignes, erreurs };
}

// ── Validateur métier ─────────────────────────────────────────────────────────

interface EmployeeRef {
  id: string;
  matricule: string;
  salaire_brut: number;
  full_name: string;
}

/**
 * Valide les lignes parsées contre la liste des employés actifs.
 *
 * Règles :
 * - matricule doit correspondre à un employé actif de l'entreprise
 * - période au format YYYY-MM
 * - une seule période par fichier
 * - h15 + h50 + h75 + h100 >= 0 (avertissement si tous à 0)
 * - Calcule montant_calcule = somme des 4 paliers × taux_horaire
 */
export function validerLignesHS(
  lignes: LigneImportHS[],
  employees: EmployeeRef[],
): ValidationResult {
  const valides: LigneValideeHS[] = [];
  const erreurs: string[] = [];
  const avertissements: string[] = [];

  if (lignes.length === 0) {
    erreurs.push("Le fichier ne contient aucune ligne de données.");
    return { valides, erreurs, avertissements };
  }

  // Vérifier unicité de la période
  const periodes = new Set(lignes.map((l) => l.periode));
  if (periodes.size > 1) {
    erreurs.push(
      `Le fichier contient plusieurs périodes : ${Array.from(periodes).join(", ")}. Un fichier = une seule période.`,
    );
    return { valides, erreurs, avertissements };
  }

  const PERIODE_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
  const empMap = new Map(employees.map((e) => [e.matricule.trim().toUpperCase(), e]));

  lignes.forEach((ligne, idx) => {
    const rowLabel = `Ligne ${idx + 2} (${ligne.matricule || "?"})`;

    // Validation format période
    if (!PERIODE_RE.test(ligne.periode)) {
      erreurs.push(`${rowLabel} : période "${ligne.periode}" invalide (attendu YYYY-MM).`);
      return;
    }

    // Validation matricule
    const emp = empMap.get(ligne.matricule.trim().toUpperCase());
    if (!emp) {
      erreurs.push(`${rowLabel} : matricule "${ligne.matricule}" introuvable dans la liste des employés actifs.`);
      return;
    }

    // Avertissement si tout à 0
    if (ligne.h15 + ligne.h50 + ligne.h75 + ligne.h100 === 0) {
      avertissements.push(`${rowLabel} : toutes les heures sont à 0 — ligne acceptée mais sans impact paie.`);
    }

    const taux_horaire = emp.salaire_brut > 0
      ? Math.round(emp.salaire_brut / HEURES_MENSUELLES)
      : 0;

    const montant_calcule = calculerMontantTotal(ligne, taux_horaire);

    valides.push({
      ...ligne,
      employee_id: emp.id,
      salaire_brut: emp.salaire_brut,
      taux_horaire,
      montant_calcule,
    });
  });

  return { valides, erreurs, avertissements };
}
