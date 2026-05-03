import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const baseSchema = z.object({
  unite_travail: z.string().min(1).max(150),
  category: z.string().min(1).max(80),
  description: z.string().min(3),
  exposure: z.string().nullable().optional(),
  gravite: z.coerce.number().int().min(1).max(4),
  probabilite: z.coerce.number().int().min(1).max(4),
  prevention_existante: z.string().nullable().optional(),
  prevention_a_venir: z.string().nullable().optional(),
  responsable: z.string().max(150).nullable().optional(),
  echeance: z.string().nullable().optional(),
  status: z.enum(["identifie", "en_traitement", "maitrise", "reevalue"]).optional(),
});

export async function GET(): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const { data, error } = await supabase
    .from("duerp_risks")
    .select("*")
    .eq("company_id", companyId as string)
    .order("criticite", { ascending: false });

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
  const parsed = baseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const { data, error } = await supabase
    .from("duerp_risks")
    .insert({
      ...parsed.data,
      company_id: companyId as string,
      created_by: user.id,
      derniere_revision: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
