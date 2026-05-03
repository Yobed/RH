import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const schema = z.object({
  employee_id: z.string().uuid(),
  type: z.enum(["annuel", "maladie", "maternite", "paternite", "sans_solde", "exceptionnel"]),
  date_debut: z.string().min(1),
  date_fin: z.string().min(1),
  nb_jours: z.number().positive(),
  commentaire: z.string().max(500).optional(),
  conge_fractionne: z.boolean().optional(),
  date_reprise: z.string().nullable().optional(),
  remplacant_id: z.string().uuid().nullable().optional(),
  justificatif_url: z.string().max(500).nullable().optional(),
});

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("conges")
    .select(`id, type, date_debut, date_fin, nb_jours, statut, commentaire, created_at,
             employees(full_name, poste, matricule)`)
    .order("created_at", { ascending: false });

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
    .from("conges")
    .insert({ ...parsed.data, company_id: profile.company_id, statut: "en_attente" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit : demande de congé
  await logAuditEvent({
    action: "create",
    entity_type: "conge",
    entity_id: data.id,
    new_values: data,
  });

  return NextResponse.json(data, { status: 201 });
}

