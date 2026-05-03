import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  employee_id: z.string().uuid(),
  periode: z.string().regex(/^\d{4}-\d{2}$/),
  type: z.enum(["acquisition", "prise", "annulation"]),
  nb_jours: z.number().min(0.5).max(30),
  motif: z.string().max(500).optional(),
});

export async function GET(req: Request) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employee_id");
  const annee = searchParams.get("annee");

  let query = supabase
    .from("rtt_records")
    .select(`id, periode, type, nb_jours, motif, statut, created_at,
             employees(full_name, matricule)`)
    .order("periode", { ascending: false });

  if (employeeId) query = query.eq("employee_id", employeeId);
  if (annee) query = query.like("periode", `${annee}-%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// GET /api/rtt/solde?employee_id=xxx  → solde (acquisition - prises)
export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("id", user.id).limit(1).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

  const d = parsed.data;
  const { data, error } = await supabase
    .from("rtt_records")
    .insert({
      company_id: profile.company_id,
      employee_id: d.employee_id,
      periode: d.periode,
      type: d.type,
      nb_jours: d.nb_jours,
      motif: d.motif ?? null,
      valide_par: user.id,
    })
    .select()
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent({
    action: "create",
    entity_type: "rtt_records",
    entity_id: data?.id,
    details: { employee_id: d.employee_id, type: d.type, nb_jours: d.nb_jours, periode: d.periode },
  });

  return NextResponse.json(data, { status: 201 });
}
