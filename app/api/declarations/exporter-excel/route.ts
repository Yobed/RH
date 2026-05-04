import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as XLSX from "xlsx";
import { buildDeclaration } from "../_builder";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    kind: z.enum(["DIPE", "DISA", "DASC", "ITS_MENSUEL", "ITS_ANNUEL"]),
    periode: z.string().regex(/^\d{4}(-\d{2})?$/, "Format invalide (YYYY ou YYYY-MM)"),
  })
  .refine(
    (d) => {
      const isMonthly = d.kind === "DIPE" || d.kind === "ITS_MENSUEL";
      return isMonthly ? d.periode.length === 7 : d.periode.length === 4;
    },
    { message: "Période incompatible avec le type de déclaration" }
  );

const KIND_TITLES: Record<string, string> = {
  DIPE: "DIPE — Déclaration Individuelle de Paie Employeur",
  DISA: "DISA — Déclaration Individuelle des Salaires Annuels",
  DASC: "DASC — Déclaration Annuelle Sociales et Cotisations",
  ITS_MENSUEL: "État 301 — ITS Mensuel (DGI)",
  ITS_ANNUEL: "État 301 — ITS Annuel (DGI)",
};

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const result = await buildDeclaration(
    supabase,
    companyId as string,
    parsed.data.kind,
    parsed.data.periode
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  // Construction du classeur Excel
  const wb = XLSX.utils.book_new();

  // Feuille 1 : entête + tableau
  const headerRows: (string | number)[][] = [
    [KIND_TITLES[result.kind] ?? result.kind],
    [`Période : ${result.periode}`],
    [`Échéance : ${result.deadline.toISOString().slice(0, 10)}`],
    [`Entreprise : ${result.company.raison_sociale}`],
    [`N° CNPS : ${result.company.cnps_matricule ?? "—"}    NCC : ${result.company.ncc ?? "—"}`],
    [`Nombre de salariés : ${result.totals.nb_salaries}`],
    [],
  ];

  const dataRows = result.rows.map((row) =>
    result.columns.map((col) => row[col] ?? "")
  );

  // Ligne de totaux
  const totalRow: (string | number)[] = result.columns.map((col, i) => {
    if (i === 0) return "TOTAL";
    if (i === 1 || i === 2) return "";
    const sum = result.rows.reduce((acc, r) => {
      const v = r[col];
      return acc + (typeof v === "number" ? v : 0);
    }, 0);
    return sum;
  });

  const aoa = [...headerRows, result.columns, ...dataRows, [], totalRow];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Largeurs de colonnes
  ws["!cols"] = result.columns.map((c) => ({
    wch: Math.max(c.length + 2, 14),
  }));

  // Fusion du titre sur toute la largeur
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: result.columns.length - 1 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, result.kind);

  // Feuille 2 : récapitulatif
  const summaryAoa: (string | number)[][] = [
    ["Récapitulatif"],
    [],
    ["Type de déclaration", result.kind],
    ["Période", result.periode],
    ["Échéance", result.deadline.toISOString().slice(0, 10)],
    ["Salariés concernés", result.totals.nb_salaries],
    [],
    ["Total brut", result.totals.total_brut],
    ["Total cotisations", result.totals.total_cotisations],
    ["Total assiette imposable", result.totals.total_assiette],
    ["Total retenu (ITS)", result.totals.total_retenu],
    ["Pénalité calculée", result.totals.penalite],
    ["Total dû", result.totals.total_du],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryAoa);
  summaryWs["!cols"] = [{ wch: 28 }, { wch: 22 }];
  summaryWs["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Récapitulatif");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `${result.kind}_${result.periode}_${(
    result.company.cnps_matricule ?? ""
  ).replace(/\s/g, "")}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
