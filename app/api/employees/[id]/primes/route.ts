import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  libelle: z.string().min(1, "Libellé requis").max(120),
  montant: z.coerce.number().min(0, "Montant ≥ 0"),
  imposable: z.boolean(),
  actif: z.boolean().default(true),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

async function getCompanyId(supabase: ReturnType<typeof createServerClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle();
  return data?.company_id ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await supabase
    .from("contract_primes")
    .select("id, libelle, montant, imposable, actif, date_debut, date_fin, notes, created_at, updated_at")
    .eq("employee_id", params.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const d = parsed.data;

  const { data, error } = await supabase
    .from("contract_primes")
    .insert({
      company_id: companyId,
      employee_id: params.id,
      libelle: d.libelle,
      montant: d.montant,
      imposable: d.imposable,
      actif: d.actif,
      date_debut: d.date_debut || null,
      date_fin: d.date_fin || null,
      notes: d.notes || null,
    })
    .select()
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data?.id) {
    await logAuditEvent({
      action: "create",
      entity_type: "contract_prime",
      entity_id: data.id,
      details: { employee_id: params.id, libelle: d.libelle, imposable: d.imposable },
      new_values: data,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
