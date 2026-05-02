import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  intitule: z.string().min(2).max(200),
  organisme: z.string().max(150).nullable().optional(),
  modality: z.enum(["interne", "externe", "e_learning", "tutorat"]).default("externe"),
  description: z.string().nullable().optional(),
  domaine: z.string().max(80).nullable().optional(),
  date_debut: z.string().min(1),
  date_fin: z.string().nullable().optional(),
  duree_heures: z.coerce.number().min(0).max(2000).default(0),
  cout_total: z.coerce.number().min(0).default(0),
  statut: z.enum(["planifie", "en_cours", "termine", "annule"]).default("planifie"),
  fdfp_eligible: z.boolean().default(true),
  participants: z.array(z.string().uuid()).optional().default([]),
});

export async function GET(): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const { data, error } = await supabase
    .from("training_actions")
    .select(`
      id, intitule, organisme, modality, domaine, date_debut, date_fin,
      duree_heures, cout_total, statut, fdfp_eligible, fdfp_remboursement,
      training_participants(employee_id, presence_taux, evaluation, certifie)
    `)
    .eq("company_id", companyId as string)
    .order("date_debut", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request): Promise<NextResponse> {
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

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const { participants, ...action } = parsed.data;

  const { data: created, error } = await supabase
    .from("training_actions")
    .insert({
      ...action,
      date_fin: action.date_fin || null,
      organisme: action.organisme || null,
      description: action.description || null,
      domaine: action.domaine || null,
      company_id: companyId as string,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (participants && participants.length > 0) {
    await supabase.from("training_participants").insert(
      participants.map((empId) => ({
        training_id: created.id,
        employee_id: empId,
      }))
    );
  }

  return NextResponse.json(created, { status: 201 });
}
