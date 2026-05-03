import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

const patchSchema = z.object({
  statut: z.enum(["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { data: companyId, error: companyError } = await supabase.rpc("get_user_company_id");
  if (companyError || !companyId) {
    return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });
  }

  // Récupérer l'ancienne version pour l'audit
  const { data: oldData } = await supabase
    .from("evaluations")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data, error } = await supabase
    .from("evaluations")
    .update({ statut: parsed.data.statut })
    .eq("id", params.id)
    .eq("company_id", companyId as string)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // AUDIT
  await logAuditEvent({
    action: "update",
    entity_type: "evaluation",
    entity_id: params.id,
    old_values: oldData || undefined,
    new_values: data,
  });

  return NextResponse.json(data);
}
