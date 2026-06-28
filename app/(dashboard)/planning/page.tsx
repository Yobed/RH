export const dynamic = "force-dynamic";
import { PageShell } from "@/components/ui/page-shell";
import { createServerClient } from "@/lib/supabase/server";
import { PlanningClient } from "@/components/rh/PlanningClient";
import { startOfWeek, addDays, format, parseISO, isValid } from "date-fns";

export const metadata = { title: "Planning — RH Manager CI" };

interface Props {
  searchParams: { week?: string };
}

export default async function PlanningPage({ searchParams }: Props) {
  const supabase = createServerClient();

  // Détermine le lundi de la semaine demandée (ou la semaine en cours)
  const requested = searchParams.week ? parseISO(searchParams.week) : new Date();
  const monday = startOfWeek(isValid(requested) ? requested : new Date(), { weekStartsOn: 1 });
  const sunday = addDays(monday, 6);
  const fromStr = format(monday, "yyyy-MM-dd");
  const toStr = format(sunday, "yyyy-MM-dd");

  const [{ data: employees }, { data: shifts }, { data: assignments }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, poste")
      .neq("statut", "inactif")
      .order("full_name"),
    supabase.from("shifts").select("*").order("name"),
    supabase
      .from("shift_assignments")
      .select("id, employee_id, shift_id, date, notes")
      .gte("date", fromStr)
      .lte("date", toStr),
  ]);

  return (
    <PageShell>
      <PlanningClient
        employees={employees ?? []}
        shifts={shifts ?? []}
        assignments={assignments ?? []}
        weekStart={fromStr}
      />
    </PageShell>
  );
}
