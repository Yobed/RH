import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  source_from: z.string().datetime({ offset: true }),
  source_to: z.string().datetime({ offset: true }),
  target_from: z.string().datetime({ offset: true }),
});

interface SourceSlot {
  role_id: string | null;
  employee_id: string | null;
  start_at: string;
  end_at: string;
  project: string | null;
  notes: string | null;
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const sourceFrom = new Date(parsed.data.source_from);
  const sourceTo = new Date(parsed.data.source_to);
  const targetFrom = new Date(parsed.data.target_from);
  const deltaMs = targetFrom.getTime() - sourceFrom.getTime();

  if (deltaMs === 0) {
    return NextResponse.json({ error: "La période cible est identique à la source." }, { status: 400 });
  }

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });

  const { data: sourceSlots, error: srcErr } = await supabase
    .from("planning_slots")
    .select("role_id, employee_id, start_at, end_at, project, notes")
    .gte("start_at", parsed.data.source_from)
    .lt("start_at", parsed.data.source_to);

  if (srcErr) return NextResponse.json({ error: srcErr.message }, { status: 500 });
  const slots = (sourceSlots ?? []) as SourceSlot[];

  if (slots.length === 0) {
    return NextResponse.json({ copied_count: 0, skipped_count: 0, conflict_count: 0 });
  }

  // Pré-charger les slots déjà présents dans la période cible pour détecter conflits
  const targetTo = new Date(targetFrom.getTime() + (sourceTo.getTime() - sourceFrom.getTime()));
  const { data: existingInTarget } = await supabase
    .from("planning_slots")
    .select("employee_id, start_at, end_at")
    .gte("start_at", targetFrom.toISOString())
    .lt("start_at", targetTo.toISOString());

  const existingByEmployee = new Map<string, Array<{ start: number; end: number }>>();
  for (const s of (existingInTarget ?? []) as { employee_id: string | null; start_at: string; end_at: string }[]) {
    if (!s.employee_id) continue;
    const entry = { start: new Date(s.start_at).getTime(), end: new Date(s.end_at).getTime() };
    const list = existingByEmployee.get(s.employee_id);
    if (list) list.push(entry);
    else existingByEmployee.set(s.employee_id, [entry]);
  }

  const toInsert: Array<{
    company_id: string;
    role_id: string | null;
    employee_id: string | null;
    start_at: string;
    end_at: string;
    project: string | null;
    notes: string | null;
    status: "brouillon";
    created_by: string;
  }> = [];

  let conflictCount = 0;

  for (const s of slots) {
    const newStart = new Date(new Date(s.start_at).getTime() + deltaMs);
    const newEnd = new Date(new Date(s.end_at).getTime() + deltaMs);

    if (s.employee_id) {
      const conflicts = existingByEmployee.get(s.employee_id) ?? [];
      const overlap = conflicts.some((c) => c.start < newEnd.getTime() && c.end > newStart.getTime());
      if (overlap) {
        conflictCount++;
        continue;
      }
    }

    toInsert.push({
      company_id: companyId as string,
      role_id: s.role_id,
      employee_id: s.employee_id,
      start_at: newStart.toISOString(),
      end_at: newEnd.toISOString(),
      project: s.project,
      notes: s.notes,
      status: "brouillon",
      created_by: user.id,
    });
  }

  let copiedCount = 0;
  if (toInsert.length > 0) {
    const { data: inserted, error } = await supabase
      .from("planning_slots")
      .insert(toInsert)
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    copiedCount = inserted?.length ?? 0;
  }

  return NextResponse.json({
    copied_count: copiedCount,
    skipped_count: slots.length - copiedCount - conflictCount,
    conflict_count: conflictCount,
  });
}
