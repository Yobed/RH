import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const documentSchema = z.object({
  name: z.string().min(1, "Nom obligatoire").max(200),
  file_url: z.string().url("URL invalide"),
  file_type: z.string().max(50).nullable().optional(),
  file_size_kb: z.coerce.number().int().min(0).nullable().optional(),
  famille: z
    .enum([
      "Contrat",
      "Avenant",
      "Diplômes",
      "CNI / Passeport",
      "Extrait de naissance",
      "Casier judiciaire",
      "CV",
      "Paie",
      "Médical",
      "Congés",
      "Disciplinaire",
      "Demande d'explication",
      "Formation",
      "Autre",
    ])
    .nullable()
    .optional(),
  employee_id: z.string().uuid().nullable().optional(),
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

  const parsed = documentSchema.safeParse(body);
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
    .from("documents")
    .insert({ ...parsed.data, company_id: companyId as string })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
