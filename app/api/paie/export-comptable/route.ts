/**
 * Export comptable — Journal des Opérations Diverses (OD) paie
 * Format : XLSX multi-feuilles + CSV compatible logiciels comptables (Sage, Cegid, EBP…)
 *
 * Structure du journal OD :
 *   Débit  641x (charges salariales)
 *   Débit  645x (charges patronales)
 *   Crédit 421  (rémunérations dues)
 *   Crédit 431  (CNPS — cotisations sociales)
 *   Crédit 447  (ITS à reverser)
 */

import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { calculerChargesPatronales } from "@/lib/paie-ci";

export const dynamic = 'force-dynamic';

interface LigneJournal {
  "N° pièce": string;
  "Date": string;
  "Compte": string;
  "Libellé compte": string;
  "Libellé écriture": string;
  "Débit (FCFA)": number | "";
  "Crédit (FCFA)": number | "";
  "Centre analytique": string;
  "Référence salarié": string;
}

function formatDate(periode: string): string {
  const [y, m] = periode.split("-");
  const lastDay = new Date(Number(y), Number(m), 0).getDate();
  return `${lastDay}/${m}/${y}`;
}

export async function GET(req: Request) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const periode = searchParams.get("periode"); // YYYY-MM, requis
  const format = searchParams.get("format") ?? "xlsx";

  if (!periode || !/^\d{4}-\d{2}$/.test(periode)) {
    return NextResponse.json({ error: "Paramètre 'periode' requis (format YYYY-MM)" }, { status: 400 });
  }

  const { data: bulletins, error } = await supabase
    .from("bulletins_paie")
    .select(`
      id, periode, salaire_brut, salaire_net, cnps_salarie, its,
      prime_transport, autres_retenues, avances, overtime_pay,
      employees(matricule, full_name, poste, departement)
    `)
    .eq("periode", periode)
    .eq("statut", "valide");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: companyData } = await supabase
    .from("companies")
    .select("taux_at_mp")
    .limit(1)
    .maybeSingle();

  const tauxAtMp = (companyData as { taux_at_mp?: number } | null)?.taux_at_mp ?? 0.03;
  const dateEcriture = formatDate(periode);
  const lignes: LigneJournal[] = [];
  let numPiece = 1;

  let totalBrut = 0;
  let totalCnpsSalarie = 0;
  let totalIts = 0;
  let totalNet = 0;
  let totalChargesPatronales = 0;

  for (const b of bulletins ?? []) {
    const emp = b.employees as unknown as Record<string, string | null> | null;
    const ref = emp?.matricule ?? b.id.slice(0, 8);
    const nom = emp?.full_name ?? "Salarié";
    const dept = emp?.departement ?? "";
    const piece = `OD-PAI-${periode.replace("-", "")}-${String(numPiece).padStart(3, "0")}`;
    const libBase = `Paie ${periode} — ${nom}`;
    const charges = calculerChargesPatronales(b.salaire_brut, tauxAtMp);

    totalBrut += b.salaire_brut;
    totalCnpsSalarie += b.cnps_salarie;
    totalIts += b.its;
    totalNet += b.salaire_net;
    totalChargesPatronales += charges.total;

    // Débit 6411 — Salaires bruts
    lignes.push({
      "N° pièce": piece,
      "Date": dateEcriture,
      "Compte": "6411",
      "Libellé compte": "Salaires et traitements — Personnel",
      "Libellé écriture": `${libBase} — Brut`,
      "Débit (FCFA)": b.salaire_brut,
      "Crédit (FCFA)": "",
      "Centre analytique": dept,
      "Référence salarié": ref,
    });

    // Crédit 4211 — Rémunérations dues
    lignes.push({
      "N° pièce": piece,
      "Date": dateEcriture,
      "Compte": "4211",
      "Libellé compte": "Personnel — Rémunérations dues",
      "Libellé écriture": `${libBase} — Net à payer`,
      "Débit (FCFA)": "",
      "Crédit (FCFA)": b.salaire_net,
      "Centre analytique": dept,
      "Référence salarié": ref,
    });

    // Crédit 4311 — CNPS salarié (retraite + CMU)
    lignes.push({
      "N° pièce": piece,
      "Date": dateEcriture,
      "Compte": "4311",
      "Libellé compte": "CNPS — Part salariale (retraite + CMU)",
      "Libellé écriture": `${libBase} — CNPS salarié`,
      "Débit (FCFA)": "",
      "Crédit (FCFA)": b.cnps_salarie,
      "Centre analytique": dept,
      "Référence salarié": ref,
    });

    // Crédit 4471 — ITS
    if (b.its > 0) {
      lignes.push({
        "N° pièce": piece,
        "Date": dateEcriture,
        "Compte": "4471",
        "Libellé compte": "ITS — Impôt sur traitements et salaires",
        "Libellé écriture": `${libBase} — ITS`,
        "Débit (FCFA)": "",
        "Crédit (FCFA)": b.its,
        "Centre analytique": dept,
        "Référence salarié": ref,
      });
    }

    // Débit 6451 — Charges patronales CNPS
    lignes.push({
      "N° pièce": piece,
      "Date": dateEcriture,
      "Compte": "6451",
      "Libellé compte": "Cotisations patronales — CNPS / CMU / FDFP",
      "Libellé écriture": `${libBase} — Charges patronales`,
      "Débit (FCFA)": charges.total,
      "Crédit (FCFA)": "",
      "Centre analytique": dept,
      "Référence salarié": ref,
    });

    // Crédit 4312 — CNPS patronale
    lignes.push({
      "N° pièce": piece,
      "Date": dateEcriture,
      "Compte": "4312",
      "Libellé compte": "CNPS — Part patronale",
      "Libellé écriture": `${libBase} — CNPS patronal`,
      "Débit (FCFA)": "",
      "Crédit (FCFA)": charges.total,
      "Centre analytique": dept,
      "Référence salarié": ref,
    });

    numPiece++;
  }

  // Ligne totaux (récapitulatif)
  const recapHeaders = ["Libellé", "Montant (FCFA)"];
  const recapRows = [
    ["Masse salariale brute", totalBrut],
    ["Total net à payer", totalNet],
    ["CNPS salarié total", totalCnpsSalarie],
    ["ITS total", totalIts],
    ["Charges patronales totales", totalChargesPatronales],
    ["Coût total employeur", totalBrut + totalChargesPatronales],
    ["Nb bulletins", bulletins?.length ?? 0],
  ];

  const headers = Object.keys(lignes[0] ?? {});

  if (format === "csv") {
    const lines = [headers.join(";")];
    for (const row of lignes) {
      lines.push(headers.map((h) => {
        const v = String((row as unknown as Record<string, unknown>)[h] ?? "");
        return v.includes(";") ? `"${v}"` : v;
      }).join(";"));
    }
    const csv = "﻿" + lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="journal-od-paie-${periode}.csv"`,
      },
    });
  }

  // XLSX
  const wb = XLSX.utils.book_new();

  // Feuille 1 — Journal OD
  const wsJournal = XLSX.utils.aoa_to_sheet([
    [`JOURNAL DES OPÉRATIONS DIVERSES — PAIE ${periode}`],
    [`Édité le ${new Date().toLocaleDateString("fr-CI")}`],
    [],
    headers,
    ...lignes.map((row) => headers.map((h) => (row as unknown as Record<string, unknown>)[h])),
  ]);
  wsJournal["!cols"] = headers.map((h) => ({ wch: h.length > 20 ? 30 : 18 }));
  XLSX.utils.book_append_sheet(wb, wsJournal, "Journal OD");

  // Feuille 2 — Récapitulatif
  const wsRecap = XLSX.utils.aoa_to_sheet([
    [`RÉCAPITULATIF PAIE — ${periode}`],
    [],
    recapHeaders,
    ...recapRows,
  ]);
  wsRecap["!cols"] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsRecap, "Récapitulatif");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="journal-od-paie-${periode}.xlsx"`,
    },
  });
}
