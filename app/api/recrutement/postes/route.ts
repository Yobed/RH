import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const postingSchema = z.object({
  titre: z.string().min(2, "Titre obligatoire").max(200),
  description: z.string().min(10, "Description obligatoire").max(5000),
  type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage"]).nullable().optional(),
  competences: z.array(z.string().max(100)).max(20).optional(),
  experience_min: z.coerce.number().int().min(0).nullable().optional(),
  salaire_min: z.coerce.number().min(0).nullable().optional(),
  salaire_max: z.coerce.number().min(0).nullable().optional(),
  date_limite: z.string().nullable().optional(),
  statut: z.enum(["ouvert", "fermé", "brouillon"]).default("ouvert"),
});

export async function POST(req: Request) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = postingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: companyId, error: companyError } = await supabase.rpc("get_user_company_id");
  if (companyError || !companyId) {
    return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("job_postings")
    .insert({ ...parsed.data, company_id: companyId as string })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

