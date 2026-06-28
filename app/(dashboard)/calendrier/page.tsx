import { createServerClient } from "@/lib/supabase/server";
import { CalendrierGlobal } from "@/components/rh/CalendrierGlobal";
import type { CalendarEvent } from "@/components/rh/CalendrierGlobal";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

export const metadata = { title: "Calendrier global — RH Manager CI" };

export default async function CalendrierPage() {
  const supabase = createServerClient();

  const [{ data: conges }, { data: formations }] = await Promise.all([
    supabase
      .from("conges")
      .select("id, employee_id, date_debut, date_fin, type_conge, statut, employees(first_name, last_name)")
      .eq("statut", "approuve")
      .gte("date_debut", `${new Date().getFullYear()}-01-01`),
    supabase
      .from("formations")
      .select("id, titre, date_debut, date_fin")
      .gte("date_fin", `${new Date().getFullYear()}-01-01`),
  ]);

  const events: CalendarEvent[] = [];

  for (const c of conges ?? []) {
    const empRaw = c.employees;
    const emp = Array.isArray(empRaw) ? empRaw[0] as { first_name: string; last_name: string } | undefined : empRaw as { first_name: string; last_name: string } | null;
    const start = new Date(c.date_debut);
    const end = new Date(c.date_fin);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      events.push({
        id: `conge-${c.id}-${d.toISOString().split("T")[0]}`,
        type: "conge",
        label: c.type_conge ?? "Congé",
        employe: emp ? `${emp.first_name} ${emp.last_name}` : "—",
        date: new Date(d).toISOString().split("T")[0],
      });
    }
  }

  for (const f of formations ?? []) {
    const start = new Date(f.date_debut);
    const end = new Date(f.date_fin);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      events.push({
        id: `formation-${f.id}-${d.toISOString().split("T")[0]}`,
        type: "formation",
        label: f.titre ?? "Formation",
        employe: "",
        date: new Date(d).toISOString().split("T")[0],
      });
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Calendrier global"
        description="Vue unifiée : congés, formations, fériés ivoiriens et événements RH."
        help="Tous les évènements RH (congés, contrats, visites médicales, échéances) réunis sur un seul calendrier pour une vue d'ensemble."
      />
      <CalendrierGlobal events={events} />
    </PageShell>
  );
}
