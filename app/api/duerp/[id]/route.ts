import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  unite_travail: z.string().min(1).max(150).optional(),
  category: z.string().min(1).max(80).optional(),
  description: z.string().min(3).optional(),
  exposure: z.string().nullable().optional(),
  gravite: z.coerce.number().int().min(1).max(4).optional(),
  probabilite: z.coerce.number().int().min(1).max(4).optional(),
  prevention_existante: z.string().nullable().optional(),
  prevention_a_venir: z.string().nullable().optional(),
  responsable: z.string().max(150).nullable().optional(),
  echeance: z.string().nullable().optional(),
  status: z.enum(["identifie", "en_traitement", "maitrise", "reevalue"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // Get old values for audit
  const { data: oldData } = await supabase
    .from("duerp_risks")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data, error } = await supabase
    .from("duerp_risks")
    .update({ ...parsed.data, derniere_revision: new Date().toISOString().slice(0, 10) })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit
  await logAuditEvent({
    action: "update",
    entity_type: "duerp_risk",
    entity_id: params.id,
    old_values: oldData,
    new_values: data,
  });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Get old values for audit
  const { data: oldData } = await supabase
    .from("duerp_risks")
    .select("*")
    .eq("id", params.id)
    .single();

  const { error } = await supabase.from("duerp_risks").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit
  await logAuditEvent({
    action: "delete",
    entity_type: "duerp_risk",
    entity_id: params.id,
    old_values: oldData,
  });

  return NextResponse.json({ ok: true });
}

