import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const slotSchema = z.object({
  role_id: z.string().uuid().nullable().optional(),
  employee_id: z.string().uuid().nullable().optional(),
  start_at: z.string().datetime({ offset: true }),
  end_at: z.string().datetime({ offset: true }),
  project: z.string().max(120).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(["brouillon", "publie"]).optional().default("brouillon"),
});

export async function GET(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "from et to requis (ISO datetime)" }, { status: 400 });

  const { data, error } = await supabase
    .from("planning_slots")
    .select("id, role_id, employee_id, start_at, end_at, status, project, notes, published_at")
    .gte("start_at", from)
    .lte("start_at", to)
    .order("start_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slots: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  const parsed = slotSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });

  if (new Date(parsed.data.end_at) <= new Date(parsed.data.start_at)) {
    return NextResponse.json({ error: "end_at doit être strictement après start_at" }, { status: 400 });
  }

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });

  // Détection de conflits : si un employé est assigné, vérifier qu'aucun autre slot ne chevauche
  if (parsed.data.employee_id) {
    const { data: conflicts } = await supabase
      .from("planning_slots")
      .select("id, start_at, end_at")
      .eq("employee_id", parsed.data.employee_id)
      .lt("start_at", parsed.data.end_at)
      .gt("end_at", parsed.data.start_at)
      .limit(1);
    if (conflicts && conflicts.length > 0) {
      const c = conflicts[0];
      return NextResponse.json(
        {
          error: `Conflit : le collaborateur est déjà sur un créneau de ${new Date(c.start_at).toLocaleString("fr-CI")} à ${new Date(c.end_at).toLocaleString("fr-CI")}.`,
          conflict: c,
        },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from("planning_slots")
    .insert({
      ...parsed.data,
      company_id: companyId as string,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slot: data }, { status: 201 });
}
