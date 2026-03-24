import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const legalCaseSchema = z.object({
  reference: z.string().min(1, "Référence obligatoire").max(50),
  titre: z.string().min(3, "Titre obligatoire").max(200),
  type_cas: z.enum([
    "licenciement",
    "demission",
    "discipline",
    "harcèlement",
    "accident_travail",
    "autre",
  ]),
  priorite: z.enum(["haute", "normale", "basse"]).default("normale"),
  description: z.string().max(2000).nullable().optional(),
  employee_id: z.string().uuid().nullable().optional(),
});

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

  const parsed = legalCaseSchema.safeParse(body);
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

  // Vérifier unicité de la référence
  const { count } = await supabase
    .from("legal_cases")
    .select("*", { count: "exact", head: true })
    .eq("reference", parsed.data.reference)
    .eq("company_id", companyId as string);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `La référence "${parsed.data.reference}" existe déjà.` },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("legal_cases")
    .insert({
      ...parsed.data,
      company_id: companyId as string,
      statut: "ouvert",
      date_ouverture: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
