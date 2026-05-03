import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employee_id");

  if (!employeeId) {
    return NextResponse.json({ error: "employee_id requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("rtt_records")
    .select("type, nb_jours")
    .eq("employee_id", employeeId)
    .eq("statut", "valide");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let acquis = 0;
  let pris = 0;
  let annules = 0;

  for (const row of data ?? []) {
    if (row.type === "acquisition") acquis += Number(row.nb_jours);
    else if (row.type === "prise") pris += Number(row.nb_jours);
    else if (row.type === "annulation") annules += Number(row.nb_jours);
  }

  const solde = Math.max(0, acquis - pris - annules);

  return NextResponse.json({ acquis, pris, annules, solde });
}
