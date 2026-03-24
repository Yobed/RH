import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculerBulletin } from "@/lib/paie-ci";

const schema = z.object({
  employee_id: z.string().uuid("Employé requis"),
  periode: z.string().regex(/^\d{4}-\d{2}$/, "Format YYYY-MM requis"),
  salaire_brut: z.number().positive("Salaire brut requis"),
  autres_retenues: z.number().min(0).default(0),
  avances: z.number().min(0).default(0),
});

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("bulletins_paie")
    .select(`id, periode, salaire_brut, cnps_salarie, its, autres_retenues, avances, salaire_net, statut, created_at,
             employees(full_name, poste, matricule)`)
    .order("periode", { ascending: false });

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
    .from("profiles").select("company_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

  const calcul = calculerBulletin(
    parsed.data.salaire_brut,
    parsed.data.autres_retenues,
    parsed.data.avances
  );

  const { data, error } = await supabase
    .from("bulletins_paie")
    .insert({
      company_id: profile.company_id,
      employee_id: parsed.data.employee_id,
      periode: parsed.data.periode,
      salaire_brut: calcul.salaire_brut,
      cnps_salarie: calcul.cnps_salarie,
      its: calcul.its,
      autres_retenues: parsed.data.autres_retenues,
      avances: parsed.data.avances,
      salaire_net: calcul.salaire_net,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Un bulletin existe déjà pour cet employé et cette période" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
