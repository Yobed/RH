export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import { PlanningGanttClient } from "@/components/rh/planning-gantt/PlanningGanttClient";
import { startOfWeek, addDays, formatISO } from "date-fns";

export const metadata = { title: "Planning par ressource — RH Manager CI" };

interface PageProps {
  searchParams: { from?: string; range?: string };
}

function parseRange(value: string | undefined): "week" | "twoweeks" | "month" {
  if (value === "twoweeks" || value === "month") return value;
  return "week";
}

export default async function PlanningGanttPage({ searchParams }: PageProps) {
  const supabase = createServerClient();

  const range = parseRange(searchParams.range);
  const refDate = searchParams.from ? new Date(searchParams.from) : new Date();
  const validRef = isNaN(refDate.getTime()) ? new Date() : refDate;

  const start = startOfWeek(validRef, { weekStartsOn: 1 });
  const days = range === "month" ? 28 : range === "twoweeks" ? 14 : 7;
  const end = addDays(start, days);

  const fromISO = start.toISOString();
  const toISO = end.toISOString();

  const [{ data: employees }, { data: roles }, { data: slots }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, poste, departement")
      .neq("statut", "inactif")
      .order("full_name"),
    supabase
      .from("planning_roles")
      .select("id, name, color, description")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("planning_slots")
      .select("id, role_id, employee_id, start_at, end_at, status, project, notes, published_at")
      .gte("start_at", fromISO)
      .lt("start_at", toISO)
      .order("start_at"),
  ]);

  return (
    <div className="p-0">
      <PlanningGanttClient
        employees={employees ?? []}
        roles={roles ?? []}
        initialSlots={slots ?? []}
        rangeStart={formatISO(start, { representation: "date" })}
        rangeDays={days}
        rangeKind={range}
      />
    </div>
  );
}
