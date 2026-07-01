export const dynamic = "force-dynamic";
import { PageShell } from "@/components/ui/page-shell";
import { createServerClient } from "@/lib/supabase/server";
import { PointageJournalierClient, type PointageRow } from "@/components/rh/PointageJournalierClient";
import { format, isValid, parseISO } from "date-fns";

export const metadata = { title: "Pointage journalier — RH Manager CI" };

// Tolérance de retard : arrivée au-delà de 08:15.
const RETARD_H = 8;
const RETARD_M = 15;

interface Props {
  searchParams: { date?: string };
}

export default async function PointagePage({ searchParams }: Props) {
  const supabase = createServerClient();

  const requested = searchParams.date ? parseISO(searchParams.date) : new Date();
  const day = isValid(requested) ? requested : new Date();
  const dateStr = format(day, "yyyy-MM-dd");

  const [{ data: employees }, { data: entries }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, poste, departement, photo_url")
      .eq("statut", "actif")
      .order("full_name"),
    supabase
      .from("time_entries")
      .select("id, employee_id, clock_in, clock_out, worked_minutes")
      .eq("date", dateStr),
  ]);

  // Regroupe les pointages par employé pour la journée.
  const byEmp = new Map<string, { id: string; clock_in: string; clock_out: string | null; worked_minutes: number | null }[]>();
  for (const e of entries ?? []) {
    const list = byEmp.get(e.employee_id) ?? [];
    list.push(e);
    byEmp.set(e.employee_id, list);
  }

  const rows: PointageRow[] = (employees ?? []).map((emp) => {
    const list = byEmp.get(emp.id) ?? [];
    const clockIns = list.map((e) => e.clock_in).filter(Boolean).sort();
    const clockOuts = (list.map((e) => e.clock_out).filter(Boolean) as string[]).sort();
    const arrivee = clockIns[0] ?? null; // 1er pointage = arrivée matin
    const descente = clockOuts.length ? clockOuts[clockOuts.length - 1] : null; // dernier = descente soir
    const workedMinutes = list.reduce((s, e) => s + (e.worked_minutes ?? 0), 0);
    const hasOpen = list.some((e) => !e.clock_out);
    const status: PointageRow["status"] =
      list.length === 0 ? "absent" : hasOpen ? "en_cours" : "present";
    const primaryEntry = list[0] ?? null;

    let retard = false;
    if (arrivee) {
      const d = new Date(arrivee);
      retard = d.getHours() > RETARD_H || (d.getHours() === RETARD_H && d.getMinutes() > RETARD_M);
    }

    return {
      employeeId: emp.id,
      fullName: emp.full_name,
      matricule: emp.matricule,
      poste: emp.poste ?? null,
      departement: emp.departement ?? null,
      photoUrl: (emp as { photo_url?: string | null }).photo_url ?? null,
      arrivee,
      descente,
      workedMinutes,
      status,
      retard,
      timeEntryId: primaryEntry?.id ?? null,
    };
  });

  return (
    <PageShell>
      <PointageJournalierClient rows={rows} dateStr={dateStr} />
    </PageShell>
  );
}
