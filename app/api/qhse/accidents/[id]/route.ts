import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  statut_cnps: z.enum(["non_declare", "declare", "indemnise", "clos"]).optional(),
  numero_cnps: z.string().max(50).optional(),
  jours_arret: z.number().int().min(0).optional(),
  gravite: z.enum(["bénin", "grave", "mortel"]).optional(),
  date_declaration_cnps: z.string().datetime().nullable().optional(),
  document_declaration_url: z.string().max(500).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // Get old values for audit
  const { data: oldData } = await supabase
    .from("work_accidents")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data, error } = await supabase
    .from("work_accidents")
    .update(parsed.data)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit
  await logAuditEvent({
    action: "update",
    entity_type: "work_accident",
    entity_id: params.id,
    old_values: oldData,
    new_values: data,
  });

  return NextResponse.json(data);
}

