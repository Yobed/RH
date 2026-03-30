import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

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
    })
    .eq("id", companyId as string)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
