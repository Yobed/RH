import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  libelle: z.string().min(1).max(120).optional(),
  montant: z.coerce.number().min(0).optional(),
  imposable: z.boolean().optional(),
  actif: z.boolean().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; primeId: string } }
) {
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

  const { data, error } = await supabase
    .from("contract_primes")
    .update(parsed.data)
    .eq("id", params.primeId)
    .eq("employee_id", params.id)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Prime introuvable" }, { status: 404 });

  await logAuditEvent({
    action: "update",
    entity_type: "contract_prime",
    entity_id: data.id,
    details: { employee_id: params.id, changes: parsed.data },
    new_values: data,
  });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; primeId: string } }
) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: prime } = await supabase
    .from("contract_primes")
    .select("id, libelle, montant, imposable")
    .eq("id", params.primeId)
    .eq("employee_id", params.id)
    .limit(1)
    .maybeSingle();

  if (!prime) return NextResponse.json({ error: "Prime introuvable" }, { status: 404 });

  const { error } = await supabase
    .from("contract_primes")
    .delete()
    .eq("id", params.primeId)
    .eq("employee_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent({
    action: "delete",
    entity_type: "contract_prime",
    entity_id: params.primeId,
    details: { employee_id: params.id, libelle: prime.libelle },
    new_values: prime,
  });

  return NextResponse.json({ success: true });
}
