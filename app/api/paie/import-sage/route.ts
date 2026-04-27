import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";
import {
  cleanCurrency,
  extractEmployeeInfo,
  validateRequiredColumns,
  REQUIRED_COLUMNS,
  COLUMN_MAPPING,
} from "@/lib/paie-sage-import";

export const dynamic = "force-dynamic";

type ImportError = { row: number; message: string };
type MappedFields = Record<string, number>;

export async function POST(request: Request) {
  // 1. AUTH
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: "Entreprise introuvable" }, { status: 400 });
  }

  // 2. PARSE FORM
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  const periode = formData.get("periode") as string | null;

  // 3. READ XLSX avec détection automatique du header
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // Détection automatique : chercher la ligne contenant "Jours de présence"
  // pour les fichiers Sage natifs (headerRowIndex > 0), sinon header=0 (template SIRH)
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
  const SAGE_MARKER = "Jours de présence";
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawData.length, 15); i++) {
    const row = rawData[i] as unknown[];
    if (row.some((cell) => String(cell).trim() === SAGE_MARKER)) {
      headerRowIndex = i;
      break;
    }
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: headerRowIndex,
    defval: "",
  });

  // 4. CHECKS BASIQUES
  if (rows.length === 0) {
    return NextResponse.json(
      {
        success: false,
        errors: [{ row: 0, message: "Le fichier est vide ou ne contient pas de données." }],
      },
      { status: 400 }
    );
  }
  if (rows.length > 1000) {
    return NextResponse.json(
      {
        success: false,
        errors: [
          {
            row: 0,
            message:
              "Le fichier contient plus de 1000 lignes. Importez par tranches de 1000 lignes maximum.",
          },
        ],
      },
      { status: 422 }
    );
  }

  // 5. VALIDATION COLONNES REQUISES
  const colError = validateRequiredColumns(REQUIRED_COLUMNS, rows[0]);
  if (colError) {
    return NextResponse.json({ success: false, errors: [{ row: 0, message: colError }] }, { status: 422 });
  }

  // 6. VALIDATION LIGNE PAR LIGNE + MAPPING 22 COLONNES
  const errors: ImportError[] = [];
  const toInsert: Record<string, unknown>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + headerRowIndex + 2;
    const { employee_id, employee_name } = extractEmployeeInfo(row["Matricule/Nom"]);

    if (!employee_id) {
      errors.push({ row: rowNum, message: `Ligne ${rowNum}: Matricule/Nom vide ou invalide.` });
      continue;
    }

    // Mapper toutes les colonnes disponibles via COLUMN_MAPPING
    const mappedFields: MappedFields = {};
    for (const [sageCol, sirhCol] of Object.entries(COLUMN_MAPPING)) {
      if (sageCol in row) {
        mappedFields[sirhCol] = cleanCurrency(row[sageCol]);
      }
    }

    // Valider les colonnes obligatoires
    if (!("base_salary" in mappedFields)) {
      errors.push({
        row: rowNum,
        message: `Ligne ${rowNum}: 'Salaire de base' non numérique ou absent.`,
      });
      continue;
    }
    if (!("net_to_pay" in mappedFields)) {
      errors.push({
        row: rowNum,
        message: `Ligne ${rowNum}: 'NET A PAYER' non numérique ou absent.`,
      });
      continue;
    }

    toInsert.push({
      company_id: profile.company_id,
      employee_id,
      employee_name: employee_name || null,
      ...mappedFields,
      periode: periode ?? null,
      import_source: "sage",
      imported_at: new Date().toISOString(),
      imported_by: user.id,
    });
  }

  // 7. SI ERREURS — retour immédiat sans insert
  if (errors.length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 422 });
  }

  // 8. INSERT
  const { error: insertError } = await supabase.from("payroll_logs").insert(toInsert);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // 9. SUCCÈS
  return NextResponse.json({ success: true, imported: toInsert.length, errors: [] });
}
