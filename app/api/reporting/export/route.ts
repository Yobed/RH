import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  if (rows.length === 0) return headers.join(",");
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCSV(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET() {
  const supabase = createServerClient();

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;

  const [bulletinsRes, congesRes, employeesRes, evaluationsRes] = await Promise.all([
    supabase
      .from("bulletins_paie")
      .select("periode, salaire_brut, salaire_net, cnps_salarie, its, prime_transport, avances, autres_retenues")
      .gte("periode", `${currentYear - 1}-01`)
      .order("periode"),
    supabase
      .from("conges")
      .select("type, nb_jours, statut, date_debut")
      .gte("date_debut", yearStart),
    supabase
      .from("employees")
      .select("full_name, poste, date_embauche, statut, salaire_base, categorie_emploi"),
    supabase
      .from("evaluations")
      .select("score_global, date_evaluation, type_evaluation")
      .gte("date_evaluation", yearStart),
  ]);

  // Sheet 1: Masse salariale mensuelle
  const masseSalariale: Record<string, unknown>[] = [];
  const byPeriod = new Map<string, { brut: number; net: number; cnps: number; its: number }>();
  for (const b of bulletinsRes.data ?? []) {
    const existing = byPeriod.get(b.periode) ?? { brut: 0, net: 0, cnps: 0, its: 0 };
    byPeriod.set(b.periode, {
      brut: existing.brut + b.salaire_brut,
      net: existing.net + b.salaire_net,
      cnps: existing.cnps + b.cnps_salarie,
      its: existing.its + b.its,
    });
  }
  Array.from(byPeriod.entries()).forEach(([periode, vals]) => {
    masseSalariale.push({
      Période: periode,
      "Masse brute (FCFA)": vals.brut,
      "Masse nette (FCFA)": vals.net,
      "CNPS salarié (FCFA)": vals.cnps,
      "ITS (FCFA)": vals.its,
      "Charges totales (FCFA)": vals.brut - vals.net,
    });
  });

  // Sheet 2: Congés par type
  const congesRows = (congesRes.data ?? []).map((c) => ({
    Type: c.type,
    "Jours demandés": c.nb_jours,
    Statut: c.statut,
    "Date début": c.date_debut,
  }));

  // Sheet 3: Effectif
  const effectifRows = (employeesRes.data ?? []).map((e) => ({
    Nom: e.full_name,
    Poste: e.poste,
    "Date embauche": e.date_embauche ?? "",
    Statut: e.statut,
    "Salaire base (FCFA)": e.salaire_base,
    Catégorie: e.categorie_emploi ?? "",
  }));

  // Sheet 4: Évaluations
  const evalRows = (evaluationsRes.data ?? []).map((e) => ({
    "Score global": e.score_global,
    "Date évaluation": e.date_evaluation,
    Type: e.type_evaluation,
  }));

  const masseCols = ["Période", "Masse brute (FCFA)", "Masse nette (FCFA)", "CNPS salarié (FCFA)", "ITS (FCFA)", "Charges totales (FCFA)"];
  const congesCols = ["Type", "Jours demandés", "Statut", "Date début"];
  const effectifCols = ["Nom", "Poste", "Date embauche", "Statut", "Salaire base (FCFA)", "Catégorie"];
  const evalCols = ["Score global", "Date évaluation", "Type"];

  const csv = [
    `=== MASSE SALARIALE MENSUELLE (${currentYear - 1} → ${currentYear}) ===`,
    toCSV(masseSalariale, masseCols),
    "",
    `=== CONGÉS ${currentYear} ===`,
    toCSV(congesRows, congesCols),
    "",
    "=== EFFECTIF ===",
    toCSV(effectifRows, effectifCols),
    "",
    `=== ÉVALUATIONS ${currentYear} ===`,
    toCSV(evalRows, evalCols),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporting-rh-${currentYear}.csv"`,
    },
  });
}
