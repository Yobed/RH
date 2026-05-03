/**
 * Export Registre du Personnel — Format légal ivoirien
 * Base légale : Art. 15.5 Code du Travail CI + Arrêté n°245/MEMEASS/CAB du 10/02/1976
 * Obligations : tenu à jour, conservé 5 ans après départ, accessible inspecteur du travail
 */

import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "xlsx";
  const statut = searchParams.get("statut"); // actif | inactif | tous

  let query = supabase
    .from("employees")
    .select(`
      matricule, full_name, civilite, genre, date_naissance, lieu_naissance, nationalite,
      num_cni, date_expiration_cni, etat_civil, nb_enfants, adresse, phone, email,
      poste, departement, categorie_emploi, categorie, type_contrat,
      date_embauche, date_fin_contrat, date_debut_essai, date_fin_essai,
      salaire_base, statut, convention_collective,
      num_securite_sociale, num_cnps,
      created_at
    `)
    .order("matricule");

  if (statut && statut !== "tous") {
    query = query.eq("statut", statut);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((e, index) => ({
    "N° d'ordre": index + 1,
    "Matricule": e.matricule ?? "",
    "Civilité": e.civilite ?? "",
    "Nom complet": e.full_name,
    "Genre (M/F)": e.genre ?? "",
    "Date de naissance": e.date_naissance ?? "",
    "Lieu de naissance": e.lieu_naissance ?? "",
    "Nationalité": e.nationalite ?? "Ivoirienne",
    "N° CNI / Passeport": e.num_cni ?? "",
    "Expiration CNI": e.date_expiration_cni ?? "",
    "Situation familiale": e.etat_civil ?? "",
    "Nb enfants à charge": e.nb_enfants ?? 0,
    "Adresse domicile": e.adresse ?? "",
    "Téléphone": e.phone ?? "",
    "Email": e.email ?? "",
    "Poste occupé": e.poste,
    "Département / Service": e.departement ?? "",
    "Catégorie professionnelle": e.categorie_emploi ?? "",
    "Catégorie / Classification": e.categorie ?? "",
    "Convention collective": e.convention_collective ?? "",
    "Type de contrat": e.type_contrat ?? "",
    "Date d'embauche": e.date_embauche ?? "",
    "Fin de contrat prévue": e.date_fin_contrat ?? "",
    "Période d'essai début": e.date_debut_essai ?? "",
    "Période d'essai fin": e.date_fin_essai ?? "",
    "Salaire de base (FCFA)": e.salaire_base ?? 0,
    "N° CNPS": e.num_cnps ?? "",
    "Statut actuel": e.statut,
    "Date d'enregistrement": e.created_at ? new Date(e.created_at).toLocaleDateString("fr-CI") : "",
  }));

  const headers = Object.keys(rows[0] ?? {});

  if (format === "csv") {
    const lines = [headers.join(";")];
    for (const row of rows) {
      lines.push(headers.map((h) => {
        const v = String((row as Record<string, unknown>)[h] ?? "");
        return v.includes(";") ? `"${v}"` : v;
      }).join(";"));
    }
    const csv = "﻿" + lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="registre-personnel-ci-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // XLSX — format légal avec en-tête informatif
  const wb = XLSX.utils.book_new();

  // Feuille 1 — Registre complet
  const wsData: unknown[][] = [
    [`REGISTRE DU PERSONNEL — Conforme Art. 15.5 Code du Travail ivoirien`],
    [`Édité le ${new Date().toLocaleDateString("fr-CI")} — ${rows.length} salarié(s)`],
    [],
    headers,
    ...rows.map((row) => headers.map((h) => (row as Record<string, unknown>)[h])),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Largeurs de colonnes adaptées
  ws["!cols"] = headers.map(() => ({ wch: 22 }));

  XLSX.utils.book_append_sheet(wb, ws, "Registre du Personnel");

  // Feuille 2 — Actifs seulement
  const actifsData = rows.filter((r) => r["Statut actuel"] === "actif");
  const wsActifs = XLSX.utils.aoa_to_sheet([
    headers,
    ...actifsData.map((row) => headers.map((h) => (row as Record<string, unknown>)[h])),
  ]);
  wsActifs["!cols"] = headers.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, wsActifs, "Actifs");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="registre-personnel-ci-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
