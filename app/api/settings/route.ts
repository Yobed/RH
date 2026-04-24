import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const fiscalParamsSchema = z.object({
  convention: z.enum([
    "CCI",
    "Commerce",
    "BTP",
    "Banque & Assurance",
    "Transport",
    "Industrie",
    "Agriculture",
  ]),
  valeur_point: z
    .number({ invalid_type_error: "Valeur de point doit être un nombre" })
    .min(0, "Valeur de point ne peut pas être négative")
    .max(1000000, "Valeur de point trop élevée"),
});

/** GET /api/settings — retourne les fiscal_params de l'entreprise */
export async function GET() {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: companyId, error: companyError } = await supabase.rpc(
    "get_user_company_id"
  );
  if (companyError || !companyId) {
    return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("fiscal_params")
    .select("id, convention, valeur_point, updated_at")
    .eq("company_id", companyId as string)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}

/** PUT /api/settings — upsert les fiscal_params de l'entreprise */
export async function PUT(req: Request) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: companyId, error: companyError } = await supabase.rpc(
    "get_user_company_id"
  );
  if (companyError || !companyId) {
    return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = fiscalParamsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("fiscal_params")
    .upsert(
      {
        company_id: companyId as string,
        convention: parsed.data.convention,
        valeur_point: parsed.data.valeur_point,
      },
      { onConflict: "company_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

