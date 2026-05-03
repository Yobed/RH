import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

const COLUMNS: { key: string; header: string }[] = [
  { key: "matricule", header: "Matricule" },
  { key: "full_name", header: "Nom complet" },
  { key: "genre", header: "Genre" },
  { key: "date_naissance", header: "Date de naissance" },
  { key: "date_embauche", header: "Date d'embauche" },
  { key: "type_contrat", header: "Type de contrat" },
  { key: "poste", header: "Poste" },
  { key: "departement", header: "Département" },
  { key: "categorie", header: "Catégorie" },
  { key: "salaire_brut", header: "Salaire brut (FCFA)" },
  { key: "sursalaire", header: "Sursalaire (FCFA)" },
  { key: "prime_transport", header: "Prime transport (FCFA)" },
  { key: "nb_enfants", header: "Nb enfants" },
  { key: "nationalite", header: "Nationalité" },
  { key: "etat_civil", header: "État civil" },
  { key: "statut", header: "Statut" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Téléphone" },
];

const LEGEND_ROWS = [
  ["Colonne", "Description", "Valeurs acceptées"],
  ["matricule", "Identifiant unique employé", "Texte libre (ex: EMP001)"],
  ["full_name", "Nom et prénom *", "Texte libre"],
  ["genre", "Sexe", "M ou F"],
  ["date_naissance", "Date de naissance", "DD/MM/YYYY ou YYYY-MM-DD"],
  ["date_embauche", "Date d'embauche *", "DD/MM/YYYY ou YYYY-MM-DD"],
  ["type_contrat", "Type de contrat *", "CDI, CDD, STAGE, APPRENTISSAGE"],
  ["poste", "Intitulé du poste", "Texte libre"],
  ["departement", "Département / Service", "Texte libre"],
  ["categorie", "Catégorie professionnelle", "Texte libre"],
  ["salaire_brut", "Salaire brut mensuel en FCFA *", "Nombre > 0"],
  ["sursalaire", "Sursalaire mensuel en FCFA", "Nombre >= 0"],
  ["prime_transport", "Prime de transport en FCFA", "Nombre >= 0"],
  ["nb_enfants", "Nombre d'enfants à charge", "Entier >= 0"],
  ["nationalite", "Nationalité", "Texte libre (ex: Ivoirienne)"],
  ["etat_civil", "Situation familiale", "Texte libre (ex: Marié(e))"],
  ["statut", "Statut du collaborateur", "actif ou inactif"],
  ["email", "Adresse email professionnelle", "Email valide"],
  ["phone", "Numéro de téléphone", "Texte libre (ex: +225 07 00 00 00 00)"],
];

type EmployeeRow = Record<string, unknown>;

function buildXlsx(employees: EmployeeRow[], filename: string): Buffer {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Employés
  const dataRows = employees.map((emp) =>
    COLUMNS.reduce<Record<string, unknown>>((acc, col) => {
      acc[col.header] = emp[col.key] ?? "";
      return acc;
    }, {})
  );
  const ws = XLSX.utils.json_to_sheet(dataRows, {
    header: COLUMNS.map((c) => c.header),
  });

  // Column widths
  ws["!cols"] = COLUMNS.map(() => ({ wch: 22 }));

  // Header row style (bold)
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
    if (cell) {
      cell.s = { font: { bold: true }, fill: { fgColor: { rgb: "1E293B" } } };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "Employés");

  // Sheet 2: Légende
  const wsLegend = XLSX.utils.aoa_to_sheet(LEGEND_ROWS);
  wsLegend["!cols"] = [{ wch: 20 }, { wch: 36 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(wb, wsLegend, "Légende");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;
  void filename; // filename used by caller for Content-Disposition
  return buf;
}

function buildCsv(employees: EmployeeRow[]): string {
  const BOM = "﻿";
  const headers = COLUMNS.map((c) => c.header).join(";");
  const rows = employees.map((emp) =>
    COLUMNS.map((col) => {
      const val = emp[col.key] ?? "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(";") || str.includes('"') || str.includes("\n")
        ? `"${str}"`
        : str;
    }).join(";")
  );
  return BOM + [headers, ...rows].join("\r\n");
}

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const statutFilter = searchParams.get("statut");
  const format = searchParams.get("format") ?? "xlsx";

  let query = supabase
    .from("employees")
    .select(COLUMNS.map((c) => c.key).join(", "))
    .eq("company_id", profile.company_id)
    .order("full_name", { ascending: true });

  if (statutFilter && ["actif", "inactif"].includes(statutFilter)) {
    query = query.eq("statut", statutFilter);
  }

  const { data: employees, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (employees ?? []) as unknown as EmployeeRow[];
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const filename = `export_employes_${today}`;

  if (format === "csv") {
    const csv = buildCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  // Default: xlsx
  const xlsxBuf = buildXlsx(rows, filename);
  return new NextResponse(xlsxBuf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}
