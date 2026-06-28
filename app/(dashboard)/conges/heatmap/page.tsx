export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import { HeatmapAbsences } from "@/components/rh/HeatmapAbsences";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

export const metadata = { title: "Heatmap Absences — RH Manager CI" };

interface RawConge {
  date_debut: string;
  date_fin: string;
  type: string;
  statut: string;
  employees:
    | { full_name: string; departement: string }
    | { full_name: string; departement: string }[]
    | null;
}

export default async function HeatmapPage() {
  const supabase = createServerClient();
  const annee = new Date().getFullYear();
  const debut = `${annee}-01-01`;
  const fin = `${annee}-12-31`;

  const { data: rawConges } = await supabase
    .from("conges")
    .select(
      "date_debut, date_fin, type, statut, employees(full_name, departement)"
    )
    .gte("date_debut", debut)
    .lte("date_fin", fin)
    .eq("statut", "approuve");

  // Normalise la relation employees (Supabase peut retourner tableau ou objet)
  const conges = (rawConges as RawConge[] | null ?? []).map((c) => {
    const emp = Array.isArray(c.employees) ? c.employees[0] ?? null : c.employees;
    return {
      date_debut: c.date_debut,
      date_fin: c.date_fin,
      type: c.type,
      statut: c.statut,
      employees: emp,
    };
  });

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, departement")
    .eq("statut", "actif")
    .order("full_name");

  return (
    <PageShell>
      <PageHeader
        title={`Heatmap Absences ${annee}`}
        description="Visualisation des absences approuvées par employé"
        help="Vue d'ensemble des absences approuvées sur l'année, par salarié et par mois. Repère d'un coup d'œil les périodes de forte absence."
      />
      <HeatmapAbsences
        conges={conges}
        employees={employees ?? []}
        annee={annee}
      />
    </PageShell>
  );
}
