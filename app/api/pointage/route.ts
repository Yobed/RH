import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const clockSchema = z.object({
  action: z.enum(["in", "out"]),
  notes: z.string().max(500).optional(),
});

/** POST /api/pointage : clock-in ou clock-out pour l'utilisateur courant */
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, employee_id")
    .eq("id", user.id)
    .single();

  if (!profile?.employee_id) {
    return NextResponse.json({ error: "Profil employé non associé" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = clockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // Cherche l'entrée du jour
  const { data: existing } = await supabase
    .from("time_entries")
    .select("*")
    .eq("employee_id", profile.employee_id)
    .eq("date", today)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (parsed.data.action === "in") {
    if (existing) {
      return NextResponse.json({ error: "Pointage d'entrée déjà actif aujourd'hui" }, { status: 409 });
    }
    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        company_id: profile.company_id,
        employee_id: profile.employee_id,
        date: today,
        clock_in: now.toISOString(),
        source: "portal",
        notes: parsed.data.notes,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  // action === "out"
  if (!existing) {
    return NextResponse.json({ error: "Aucun pointage d'entrée à clôturer" }, { status: 409 });
  }
  const clockIn = new Date(existing.clock_in);
  const workedMinutes = Math.max(0, Math.round((now.getTime() - clockIn.getTime()) / 60000));
  const { data, error } = await supabase
    .from("time_entries")
    .update({
      clock_out: now.toISOString(),
      worked_minutes: workedMinutes,
      notes: parsed.data.notes ?? existing.notes,
    })
    .eq("id", existing.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** GET /api/pointage?from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let q = supabase
    .from("time_entries")
    .select("id, employee_id, date, clock_in, clock_out, worked_minutes, source, notes")
    .order("clock_in", { ascending: false });

  if (from) q = q.gte("date", from);
  if (to) q = q.lte("date", to);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
