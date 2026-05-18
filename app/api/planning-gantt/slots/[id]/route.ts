import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  role_id: z.string().uuid().nullable().optional(),
  employee_id: z.string().uuid().nullable().optional(),
  start_at: z.string().datetime({ offset: true }).optional(),
  end_at: z.string().datetime({ offset: true }).optional(),
  project: z.string().max(120).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  status: z.enum(["brouillon", "publie"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.start_at && parsed.data.end_at &&
      new Date(parsed.data.end_at) <= new Date(parsed.data.start_at)) {
    return NextResponse.json({ error: "end_at doit être après start_at" }, { status: 400 });
  }

  // Détection de conflits si on modifie la cible (employé ou plage)
  const willCheckConflict =
    parsed.data.employee_id !== undefined ||
    parsed.data.start_at !== undefined ||
    parsed.data.end_at !== undefined;

  if (willCheckConflict) {
    const { data: current } = await supabase
      .from("planning_slots")
      .select("id, employee_id, start_at, end_at")
      .eq("id", params.id)
      .single();
    if (current) {
      const targetEmployee = parsed.data.employee_id !== undefined ? parsed.data.employee_id : current.employee_id;
      const targetStart = parsed.data.start_at ?? current.start_at;
      const targetEnd = parsed.data.end_at ?? current.end_at;
      if (targetEmployee) {
        const { data: conflicts } = await supabase
          .from("planning_slots")
          .select("id, start_at, end_at")
          .eq("employee_id", targetEmployee)
          .neq("id", params.id)
          .lt("start_at", targetEnd)
          .gt("end_at", targetStart)
          .limit(1);
        if (conflicts && conflicts.length > 0) {
          const c = conflicts[0];
          return NextResponse.json(
            {
              error: `Conflit : le collaborateur est déjà occupé de ${new Date(c.start_at).toLocaleString("fr-CI")} à ${new Date(c.end_at).toLocaleString("fr-CI")}.`,
              conflict: c,
            },
            { status: 409 }
          );
        }
      }
    }
  }

  const payload: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "publie") payload.published_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("planning_slots")
    .update(payload)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slot: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { error } = await supabase.from("planning_slots").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
