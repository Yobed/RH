export const dynamic = 'force-dynamic';
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { CongesCalendrierClient } from "@/components/rh/CongesCalendrierClient";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

export const metadata = { title: "Calendrier des Absences — RH Manager CI" };

interface SearchParams {
  mois?: string;
}

interface CongesCalendrierItem {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_departement: string | null;
  type: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  statut: string;
}

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const mois = searchParams?.mois ?? new Date().toISOString().slice(0, 7);
  const debut = `${mois}-01`;
  const [annee, moisNum] = mois.split("-").map(Number);
  const dernierJour = new Date(annee, moisNum, 0).getDate();
  const fin = `${mois}-${String(dernierJour).padStart(2, "0")}`;

  const supabase = createServerClient();

  const { data: congesRaw } = await supabase
    .from("conges")
    .select(
      `id, employee_id, type, date_debut, date_fin, nb_jours, statut,
       employees(full_name, departement)`
    )
    .lte("date_debut", fin)
    .gte("date_fin", debut)
    .in("statut", ["approuve", "valide_manager", "en_attente"])
    .order("date_debut");

  const conges: CongesCalendrierItem[] = (congesRaw ?? []).map((c) => {
    const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
    return {
      id: c.id,
      employee_id: c.employee_id,
      employee_name: emp?.full_name ?? "—",
      employee_departement: emp?.departement ?? null,
      type: c.type,
      date_debut: c.date_debut,
      date_fin: c.date_fin,
      nb_jours: c.nb_jours,
      statut: c.statut ?? "en_attente",
    };
  });

  const departements: string[] = Array.from(
    new Set(
      conges
        .map((c) => c.employee_departement)
        .filter((d): d is string => d !== null && d.trim() !== "")
    )
  ).sort();

  return (
    <PageShell>
      <PageHeader
        title="Calendrier des Absences"
        description="Vue mensuelle par équipe — filtre par département"
        actions={
          <span className="shrink-0 text-xs font-mono text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1 bg-white">
            {new Date(mois + "-01").toLocaleDateString("fr-CI", { month: "long", year: "numeric" })}
          </span>
        }
      />

      <CongesCalendrierClient
        conges={conges}
        departements={departements}
        moisInitial={mois}
      />
    </PageShell>
  );
}
