import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = 'force-dynamic';

const schema = z.object({
  employee_id: z.string().uuid(),
  date_accident: z.string().min(1),
  heure_accident: z.string().optional(),
  lieu: z.string().max(200).optional(),
  description: z.string().min(1).max(2000),
  gravite: z.enum(["bénin", "grave", "mortel"]),
  jours_arret: z.number().int().min(0).optional(),
});

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("work_accidents")
    .select(`id, date_accident, heure_accident, lieu, description, gravite, jours_arret, statut_cnps, numero_cnps, created_at,
             employees(full_name, poste, matricule)`)
    .order("date_accident", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

  const { data, error } = await supabase
    .from("work_accidents")
    .insert({ ...parsed.data, company_id: profile.company_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit
  await logAuditEvent({
    action: "create",
    entity_type: "work_accident",
    entity_id: data.id,
    new_values: data,
  });

  return NextResponse.json(data, { status: 201 });
}

