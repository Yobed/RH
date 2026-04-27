// lib/paie-sage-import.ts
// Équivalent TypeScript de SagePayrollImportService (Python)
// Fourni par le client — ne pas modifier la logique métier

/**
 * Mapping complet des colonnes Sage vers les colonnes SIRH (payroll_logs).
 * Source : SagePayrollImportService.column_mapping
 */
export const COLUMN_MAPPING: Record<string, string> = {
  "Jours de présence": "days_worked",
  "Salaire de base": "base_salary",
  "Sursalaire": "bonus_salary",
  "Prime d'ancienneté": "seniority_premium",
  "Indemnité de transport": "transport_allowance",
  "Indemnité congés payés": "vacation_allowance",
  "Heures supplémentaires": "overtime_pay",
  "*** SALAIRE BRUT ***": "gross_salary",
  "*** INDEMNITE EXONEREE ***": "exempt_indemnity",
  "*** BRUT FISCAL ***": "fiscal_gross",
  "*** BRUT SOCIAL ***": "social_gross",
  "Impôts sur salaire (IS)": "tax_is",
  "Contribution nationale (CN)": "tax_cn",
  "Impôt général sur revenu (IGR)": "tax_igr",
  "Retenue CNPS": "withholding_cnps",
  "*** TOTAL DES COTISATIONS ***": "total_contributions",
  "*** NET AVANT RETENUE ***": "net_before_withholding",
  "Reprise arrondi de paie (M-1)": "adjustment_m_minus_1",
  "Reprise paie négative (M-1)": "negative_pay_adjustment",
  "Avance paie négative": "negative_advance",
  "Arrondi de paie": "rounding_adjustment",
  "NET A PAYER": "net_to_pay",
} as const;

/** Colonnes obligatoires pour valider le fichier importé. */
export const REQUIRED_COLUMNS = ["NET A PAYER", "Salaire de base"] as const;

/**
 * Nettoyage robuste des montants Sage (équivalent de clean_currency Python).
 * Gère : espaces insécables ( , \xa0), espaces normaux, virgules décimales.
 * Retourne 0 pour les valeurs invalides/vides (comportement identique au Python).
 */
export function cleanCurrency(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  const s = String(value)
    .replace(/ /g, "")  // espace fine insécable (narrow no-break space)
    .replace(/\xa0/g, "")    // espace insécable
    .replace(/ /g, "")       // espace ordinaire
    .replace(",", ".");       // virgule décimale → point
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/**
 * Extrait l'identifiant et le nom depuis la valeur brute Sage de la colonne "Matricule/Nom".
 * Comportement Python : employee_id = premier mot, employee_name = reste.
 * Exemple : "EMP001 KOFFI Jean" → { employee_id: "EMP001", employee_name: "KOFFI Jean" }
 */
export function extractEmployeeInfo(rawValue: unknown): {
  employee_id: string;
  employee_name: string;
} {
  const raw = rawValue == null ? "" : String(rawValue).trim();
  if (!raw) return { employee_id: "", employee_name: "" };
  const parts = raw.split(" ");
  return {
    employee_id: parts[0] ?? "",
    employee_name: parts.slice(1).join(" "),
  };
}

/**
 * Vérifie que toutes les colonnes requises sont présentes dans la première ligne du fichier.
 * Retourne un message d'erreur pour la première colonne manquante, ou null si tout est présent.
 */
export function validateRequiredColumns(
  required: readonly string[],
  firstRow: Record<string, unknown>
): string | null {
  for (const col of required) {
    if (!(col in firstRow)) {
      return `Colonne '${col}' manquante dans le fichier importé. Vérifiez que vous avez utilisé le template fourni.`;
    }
  }
  return null;
}
