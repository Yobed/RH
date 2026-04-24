import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const schema = z.object({
  employee_id: z.string().uuid(),
  type_visite: z.enum(["embauche", "periodique", "reprise", "spontanee"]),
  date_visite: z.string().min(1),
  date_prochaine: z.string().optional(),
  resultat: z.enum(["apte", "apte_amenagement", "inapte"]).optional(),
  medecin: z.string().max(150).optional(),
  observations: z.string().max(1000).optional(),
});

export async function GET() {
  const supabase = createServerClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("medical_visits")
    .select(`id, type_visite, date_visite, date_prochaine, resultat, medecin, observations, created_at,
             employees(full_name, poste, matricule)`)
    .order("date_prochaine", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flag overdue visits
  const enriched = (data ?? []).map((v) => ({
    ...v,
    en_retard: v.date_prochaine ? v.date_prochaine < today : false,
  }));

  return NextResponse.json(enriched);
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
    .from("medical_visits")
    .insert({ ...parsed.data, company_id: profile.company_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
