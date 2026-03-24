import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const contractSchema = z
  .object({
    employee_id: z.string().uuid("Employé obligatoire"),
    type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage"]),
    date_debut: z.string().min(1, "Date de début obligatoire"),
    date_fin: z.string().nullable().optional(),
    date_fin_essai: z.string().nullable().optional(),
    salaire_brut: z.coerce.number().min(0, "Salaire invalide"),
    renouvellement_count: z.coerce.number().int().min(0).default(0),
  })
  .refine(
    (data) => {
      if (["CDD", "Stage", "Apprentissage"].includes(data.type_contrat)) {
        return !!data.date_fin;
      }
      return true;
    },
    {
      message: "Date de fin obligatoire pour CDD, Stage et Apprentissage",
      path: ["date_fin"],
    }
  );

export async function POST(req: Request) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = contractSchema.safeParse(body);
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

  // Vérifier règle ivoirienne : CDD max 2 renouvellements
  if (parsed.data.type_contrat === "CDD") {
    const { count } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", parsed.data.employee_id)
      .eq("type_contrat", "CDD");

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        {
          error:
            "Conversion CDI obligatoire. Cet employé a atteint le maximum de 2 renouvellements CDD (droit ivoirien).",
        },
        { status: 422 }
      );
    }
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      ...parsed.data,
      company_id: companyId as string,
      statut: "actif",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
