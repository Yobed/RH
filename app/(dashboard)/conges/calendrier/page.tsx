export const dynamic = 'force-dynamic';
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { CongesCalendrierClient } from "@/components/rh/CongesCalendrierClient";
import { ArrowLeft } from "lucide-react";

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
  const mois = searchParams?.mois ?? new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const debut = `${mois}-01`;

  // Calculer le dernier jour du mois
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

  // Transformer en CongesCalendrierItem[]
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

  // Extraire la liste distincte des départements non-null
  const departements: string[] = Array.from(
    new Set(
      conges
        .map((c) => c.employee_departement)
        .filter((d): d is string => d !== null && d.trim() !== "")
    )
  ).sort();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/conges"
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Calendrier des Absences</h1>
            <p className="text-sm text-muted-foreground">
              Vue mensuelle par équipe — filtre par département
            </p>
          </div>
        </div>
      </div>

      <CongesCalendrierClient
        conges={conges}
        departements={departements}
        moisInitial={mois}
      />
    </div>
  );
}
