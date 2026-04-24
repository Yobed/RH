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
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCSV(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET() {
  const supabase = createServerClient();

  const [accidentsRes, visitesRes] = await Promise.all([
    supabase
      .from("work_accidents")
      .select(`date_accident, heure_accident, lieu, description, gravite, jours_arret, statut_cnps, numero_cnps,
               employees(full_name, matricule, poste)`)
      .order("date_accident", { ascending: false }),
    supabase
      .from("medical_visits")
      .select(`type_visite, date_visite, date_prochaine, resultat, medecin, observations,
               employees(full_name, matricule, poste)`)
      .order("date_visite", { ascending: false }),
  ]);

  type EmpInfo = { full_name: string; matricule: string; poste: string } | null;

  const accidents = (accidentsRes.data ?? []).map((a) => {
    const emp = (Array.isArray(a.employees) ? a.employees[0] : a.employees) as EmpInfo;
    return {
      Date: a.date_accident,
      Heure: a.heure_accident ?? "",
      Lieu: a.lieu ?? "",
      Employé: emp?.full_name ?? "",
      Matricule: emp?.matricule ?? "",
      Description: a.description,
      Gravité: a.gravite,
      "Jours arrêt": a.jours_arret ?? 0,
      "Statut CNPS": a.statut_cnps,
      "N° CNPS": a.numero_cnps ?? "",
    };
  });

  const visites = (visitesRes.data ?? []).map((v) => {
    const emp = (Array.isArray(v.employees) ? v.employees[0] : v.employees) as EmpInfo;
    return {
      Type: v.type_visite,
      "Date visite": v.date_visite,
      "Prochaine visite": v.date_prochaine ?? "",
      Employé: emp?.full_name ?? "",
      Matricule: emp?.matricule ?? "",
      Résultat: v.resultat ?? "",
      Médecin: v.medecin ?? "",
      Observations: v.observations ?? "",
    };
  });

  const accCSV = toCSV(accidents as Record<string, unknown>[], Object.keys(accidents[0] ?? {}));
  const visCSV = toCSV(visites as Record<string, unknown>[], Object.keys(visites[0] ?? {}));
  const csv = `=== REGISTRE ACCIDENTS DU TRAVAIL ===\n${accCSV}\n\n=== REGISTRE VISITES MÉDICALES ===\n${visCSV}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registre-qhse-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
