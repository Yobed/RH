import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = 'force-dynamic';

function toRows(data: Record<string, unknown>[], headers: string[]): unknown[][] {
  const rows: unknown[][] = [headers];
  for (const row of data) {
    rows.push(headers.map((h) => row[h] ?? ""));
  }
  return rows;
}

export async function GET(req: Request) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "xlsx"; // xlsx | csv
  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;

  const [bulletinsRes, congesRes, employeesRes, evaluationsRes] = await Promise.all([
    supabase
      .from("bulletins_paie")
      .select("periode, salaire_brut, salaire_net, cnps_salarie, its, prime_transport, avances, autres_retenues, overtime_pay")
      .gte("periode", `${currentYear - 1}-01`)
      .order("periode"),
    supabase
      .from("conges")
      .select("type, nb_jours, statut, date_debut, employees(full_name)")
      .gte("date_debut", yearStart),
    supabase
      .from("employees")
      .select("full_name, matricule, poste, departement, date_embauche, statut, salaire_base, categorie_emploi, genre, type_contrat"),
    supabase
      .from("evaluations")
      .select("score_global, date_evaluation, type_evaluation, employees(full_name)")
      .gte("date_evaluation", yearStart),
  ]);

  // Feuille 1 — Masse salariale mensuelle
  const byPeriod = new Map<string, { brut: number; net: number; cnps: number; its: number; hSup: number; avances: number }>();
  for (const b of bulletinsRes.data ?? []) {
    const cur = byPeriod.get(b.periode) ?? { brut: 0, net: 0, cnps: 0, its: 0, hSup: 0, avances: 0 };
    byPeriod.set(b.periode, {
      brut: cur.brut + b.salaire_brut,
      net: cur.net + b.salaire_net,
      cnps: cur.cnps + b.cnps_salarie,
      its: cur.its + b.its,
      hSup: cur.hSup + (b.overtime_pay ?? 0),
      avances: cur.avances + (b.avances ?? 0),
    });
  }
  const masseSalariale = Array.from(byPeriod.entries()).map(([periode, v]) => ({
    "Période": periode,
    "Masse brute (FCFA)": v.brut,
    "Masse nette (FCFA)": v.net,
    "CNPS salarié (FCFA)": v.cnps,
    "ITS (FCFA)": v.its,
    "Heures sup (FCFA)": v.hSup,
    "Avances (FCFA)": v.avances,
    "Charges totales (FCFA)": v.brut - v.net,
  }));

  // Feuille 2 — Congés
  const congesRows = (congesRes.data ?? []).map((c: Record<string, unknown>) => {
    const emp = c.employees as Record<string, unknown> | null;
    return {
      "Employé": emp?.full_name ?? "",
      "Type de congé": c.type,
      "Jours demandés": c.nb_jours,
      "Statut": c.statut,
      "Date début": c.date_debut,
    };
  });

  // Feuille 3 — Effectif
  const effectifRows = (employeesRes.data ?? []).map((e) => ({
    "Matricule": e.matricule ?? "",
    "Nom complet": e.full_name,
    "Genre": e.genre ?? "",
    "Poste": e.poste,
    "Département": e.departement ?? "",
    "Type contrat": e.type_contrat ?? "",
    "Date embauche": e.date_embauche ?? "",
    "Statut": e.statut,
    "Salaire base (FCFA)": e.salaire_base ?? "",
    "Catégorie emploi": e.categorie_emploi ?? "",
  }));

  // Feuille 4 — Évaluations
  const evalRows = (evaluationsRes.data ?? []).map((e: Record<string, unknown>) => {
    const emp = e.employees as Record<string, unknown> | null;
    return {
      "Employé": emp?.full_name ?? "",
      "Score global": e.score_global,
      "Date évaluation": e.date_evaluation,
      "Type": e.type_evaluation,
    };
  });

  if (format === "csv") {
    // Fallback CSV (feuille masse salariale seulement)
    const headers = Object.keys(masseSalariale[0] ?? {});
    const lines = [headers.join(",")];
    for (const row of masseSalariale) {
      lines.push(headers.map((h) => {
        const v = String((row as Record<string, unknown>)[h] ?? "");
        return v.includes(",") ? `"${v}"` : v;
      }).join(","));
    }
    const csv = "﻿" + lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reporting-rh-${currentYear}.csv"`,
      },
    });
  }

  // XLSX multi-feuilles
  const wb = XLSX.utils.book_new();

  const sheetMasse = XLSX.utils.aoa_to_sheet(
    toRows(masseSalariale as Record<string, unknown>[], Object.keys(masseSalariale[0] ?? {}))
  );
  const sheetConges = XLSX.utils.aoa_to_sheet(
    toRows(congesRows as Record<string, unknown>[], ["Employé", "Type de congé", "Jours demandés", "Statut", "Date début"])
  );
  const sheetEffectif = XLSX.utils.aoa_to_sheet(
    toRows(effectifRows as Record<string, unknown>[], ["Matricule", "Nom complet", "Genre", "Poste", "Département", "Type contrat", "Date embauche", "Statut", "Salaire base (FCFA)", "Catégorie emploi"])
  );
  const sheetEval = XLSX.utils.aoa_to_sheet(
    toRows(evalRows as Record<string, unknown>[], ["Employé", "Score global", "Date évaluation", "Type"])
  );

  XLSX.utils.book_append_sheet(wb, sheetMasse, "Masse salariale");
  XLSX.utils.book_append_sheet(wb, sheetConges, "Congés");
  XLSX.utils.book_append_sheet(wb, sheetEffectif, "Effectif");
  XLSX.utils.book_append_sheet(wb, sheetEval, "Évaluations");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reporting-rh-${currentYear}.xlsx"`,
    },
  });
}
