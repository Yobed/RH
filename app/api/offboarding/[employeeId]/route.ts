import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildDefaultOffboardingChecklist, type OffboardingItem } from "@/lib/offboarding-template";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

const itemPatchSchema = z.object({
  id: z.string().min(1),
  done: z.boolean().optional(),
  comment: z.string().max(500).nullable().optional(),
});

const updateSchema = z.object({
  date_sortie_prevue: z.string().nullable().optional(),
  rupture_id: z.string().uuid().nullable().optional(),
  patch: itemPatchSchema.optional(),
  reset: z.boolean().optional(),
});

interface Params {
  params: { employeeId: string };
}

export async function GET(_req: Request, { params }: Params) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await supabase
    .from("offboarding_checklists")
    .select("*")
    .eq("employee_id", params.employeeId)
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? null);
}

export async function POST(req: Request, { params }: Params) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown = {};
  try { body = await req.json(); } catch {}
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const { data: existing } = await supabase
    .from("offboarding_checklists")
    .select("id")
    .eq("employee_id", params.employeeId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Checklist déjà créée pour cet employé" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("offboarding_checklists")
    .insert({
      company_id: companyId as string,
      employee_id: params.employeeId,
      rupture_id: parsed.data.rupture_id ?? null,
      date_sortie_prevue: parsed.data.date_sortie_prevue ?? null,
      items: buildDefaultOffboardingChecklist(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent({
    action: "create",
    entity_type: "offboarding_checklist",
    entity_id: data.id,
    new_values: { employee_id: params.employeeId },
  });

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request, { params }: Params) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown = {};
  try { body = await req.json(); } catch {}
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: current } = await supabase
    .from("offboarding_checklists")
    .select("*")
    .eq("employee_id", params.employeeId)
    .limit(1)
    .maybeSingle();

  if (!current) return NextResponse.json({ error: "Checklist introuvable" }, { status: 404 });

  // Construire la mise à jour
  const update: Record<string, unknown> = {};

  if (parsed.data.date_sortie_prevue !== undefined) {
    update.date_sortie_prevue = parsed.data.date_sortie_prevue;
  }
  if (parsed.data.rupture_id !== undefined) {
    update.rupture_id = parsed.data.rupture_id;
  }

  if (parsed.data.reset) {
    update.items = buildDefaultOffboardingChecklist();
    update.completed_at = null;
  } else if (parsed.data.patch) {
    const items = Array.isArray(current.items) ? (current.items as OffboardingItem[]) : [];
    const updatedItems = items.map((item) => {
      if (item.id !== parsed.data.patch!.id) return item;
      const next = { ...item };
      if (parsed.data.patch!.done !== undefined) {
        next.done = parsed.data.patch!.done;
        if (parsed.data.patch!.done) {
          next.done_at = new Date().toISOString();
          next.done_by = user.id;
        } else {
          next.done_at = null;
          next.done_by = null;
        }
      }
      if (parsed.data.patch!.comment !== undefined) {
        next.comment = parsed.data.patch!.comment;
      }
      return next;
    });
    update.items = updatedItems;

    // Si tous les items sont done → completed_at
    const allDone = updatedItems.length > 0 && updatedItems.every((it) => it.done);
    update.completed_at = allDone ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(current);
  }

  const { data, error } = await supabase
    .from("offboarding_checklists")
    .update(update)
    .eq("id", current.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent({
    action: "update",
    entity_type: "offboarding_checklist",
    entity_id: current.id,
    details: parsed.data.patch
      ? { item: parsed.data.patch.id, done: parsed.data.patch.done }
      : { fields: Object.keys(update) },
  });

  return NextResponse.json(data);
}
