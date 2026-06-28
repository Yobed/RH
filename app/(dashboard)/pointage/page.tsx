export const dynamic = "force-dynamic";
import { PageShell } from "@/components/ui/page-shell";
import { createServerClient } from "@/lib/supabase/server";
import { PointageAdminClient } from "@/components/rh/PointageAdminClient";
import { startOfWeek, addDays, format, parseISO, isValid } from "date-fns";

export const metadata = { title: "Pointage — RH Manager CI" };

interface Props {
  searchParams: { week?: string };
}

export default async function PointagePage({ searchParams }: Props) {
  const supabase = createServerClient();

  const requested = searchParams.week ? parseISO(searchParams.week) : new Date();
  const monday = startOfWeek(isValid(requested) ? requested : new Date(), { weekStartsOn: 1 });
  const sunday = addDays(monday, 6);
  const fromStr = format(monday, "yyyy-MM-dd");
  const toStr = format(sunday, "yyyy-MM-dd");

  const [{ data: employees }, { data: entries }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, poste")
      .neq("statut", "inactif")
      .order("full_name"),
    supabase
      .from("time_entries")
      .select("id, employee_id, date, clock_in, clock_out, worked_minutes")
      .gte("date", fromStr)
      .lte("date", toStr),
  ]);

  return (
    <PageShell>
      <PointageAdminClient
        employees={employees ?? []}
        entries={entries ?? []}
        weekStart={fromStr}
      />
    </PageShell>
  );
}
