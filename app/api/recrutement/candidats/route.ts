import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = 'force-dynamic';

const candidatSchema = z.object({
  full_name: z.string().min(2, "Nom obligatoire").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().max(20).nullable().optional(),
  job_id: z.string().uuid("Offre obligatoire"),
  notes_rh: z.string().max(2000).nullable().optional(),
  cv_url: z.string().url("URL invalide").nullable().optional(),
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

  const parsed = candidatSchema.safeParse(body);
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

  // Vérifier que l'offre appartient à la même entreprise
  const { data: posting } = await supabase
    .from("job_postings")
    .select("id")
    .eq("id", parsed.data.job_id)
    .eq("company_id", companyId as string)
    .single();

  if (!posting) {
    return NextResponse.json({ error: "Offre d'emploi introuvable" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      ...parsed.data,
      company_id: companyId as string,
      statut: "nouveau",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit Log
  await logAuditEvent({
    entity_type: "candidate",
    entity_id: data.id,
    action: "create",
    details: {
      full_name: parsed.data.full_name,
      job_id: parsed.data.job_id,
      statut: "nouveau"
    },
    new_values: data
  });

  return NextResponse.json(data, { status: 201 });
}

