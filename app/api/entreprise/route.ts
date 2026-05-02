import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const entrepriseSchema = z.object({
  name: z.string().min(2, "Nom obligatoire").max(200),
  convention_collective: z.string().max(200).nullable().optional(),
  raison_sociale: z.string().max(200).nullable().optional()
    .transform(v => (v === "" ? null : v)),
  adresse: z.string().nullable().optional()
    .transform(v => (v === "" ? null : v)),
  cnps_matricule: z.string().max(30).nullable().optional()
    .transform(v => (v === "" ? null : v)),
  nccm: z.string().max(30).nullable().optional()
    .transform(v => (v === "" ? null : v)),
  ncc: z.string().max(30).nullable().optional()
    .transform(v => (v === "" ? null : v)),
  taux_at_mp: z.coerce.number().min(0.02, "Min 2 %").max(0.10, "Max 10 %").nullable().optional(),
  adresse_paie: z.string().max(255).nullable().optional()
    .transform(v => (v === "" ? null : v)),
  contact_paie: z.string().max(150).nullable().optional()
    .transform(v => (v === "" ? null : v)),
  code_naf: z.string().max(20).nullable().optional()
    .transform(v => (v === "" ? null : v)),
});

export async function PUT(req: Request) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: companyId, error: companyError } = await supabase.rpc("get_user_company_id");
  if (companyError || !companyId) {
    return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = entrepriseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("companies")
    .update({
      name: parsed.data.name,
      convention_collective: parsed.data.convention_collective,
      raison_sociale: parsed.data.raison_sociale,
      adresse: parsed.data.adresse,
      cnps_matricule: parsed.data.cnps_matricule,
      nccm: parsed.data.nccm,
      ncc: parsed.data.ncc,
      taux_at_mp: parsed.data.taux_at_mp ?? undefined,
      adresse_paie: parsed.data.adresse_paie,
      contact_paie: parsed.data.contact_paie,
      code_naf: parsed.data.code_naf,
    })
    .eq("id", companyId as string)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

