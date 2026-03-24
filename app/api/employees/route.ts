import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  full_name: z.string().min(2, "Minimum 2 caractères").max(100),
  matricule: z.string().min(1, "Matricule obligatoire").max(20),
  poste: z.string().min(2, "Poste obligatoire").max(100),
  date_embauche: z.string().min(1, "Date d'embauche obligatoire"),
  genre: z.enum(["M", "F"]).nullable().optional(),
  date_naissance: z.string().nullable().optional(),
  departement: z.string().max(100).nullable().optional(),
  email: z.string().email("Email invalide").nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage"]).nullable().optional(),
  salaire_brut: z.coerce.number().min(0).nullable().optional(),
  statut: z.enum(["actif", "inactif", "suspendu"]).default("actif"),
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

  const parsed = createSchema.safeParse(body);
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
    .from("employees")
    .insert({ ...parsed.data, company_id: companyId as string })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-créer le contrat si type_contrat et salaire_brut sont renseignés
  if (parsed.data.type_contrat && parsed.data.salaire_brut != null && parsed.data.salaire_brut > 0) {
    await supabase.from("contracts").insert({
      employee_id: data.id,
      company_id: companyId as string,
      type_contrat: parsed.data.type_contrat,
      date_debut: parsed.data.date_embauche,
      salaire_brut: parsed.data.salaire_brut,
      renouvellement_count: 0,
      statut: "actif",
    });
  }

  return NextResponse.json(data, { status: 201 });
}
