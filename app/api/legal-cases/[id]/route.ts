import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

const updateSchema = z.object({
  statut: z.enum(["ouvert", "résolu", "classé", "en_appel"]),
  description: z.string().max(2000).nullable().optional(),
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
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Récupérer l'ancienne version pour l'audit
  const { data: oldData } = await supabase
    .from("legal_cases")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data, error } = await supabase
    .from("legal_cases")
    .update(parsed.data)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // AUDIT
  await logAuditEvent({
    action: "update",
    entity_type: "legal_case",
    entity_id: params.id,
    old_values: oldData || undefined,
    new_values: data,
  });

  return NextResponse.json(data);
}
