import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortailContext } from "@/lib/portail";

export const dynamic = "force-dynamic";

// Champs que le salarié peut modifier lui-même
const updateSchema = z.object({
  phone: z.string().max(20).nullable().optional(),
  adresse: z.string().max(255).nullable().optional(),
  rib: z.string().max(50).nullable().optional(),
  mobile_money: z.string().max(30).nullable().optional(),
  contact_urgence_nom: z.string().max(100).nullable().optional(),
  contact_urgence_tel: z.string().max(20).nullable().optional(),
  situation_logement: z.string().max(30).nullable().optional(),
});

export async function PATCH(req: Request): Promise<NextResponse> {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // 1) Récupérer la valeur actuelle pour audit
  const { data: current } = await supabase
    .from("employees")
    .select("phone, adresse, rib, mobile_money, contact_urgence_nom, contact_urgence_tel, situation_logement")
    .eq("id", ctx.employeeId)
    .single();

  // 2) Mettre à jour
  const { data: updated, error } = await supabase
    .from("employees")
    .update(parsed.data)
    .eq("id", ctx.employeeId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3) Audit log par champ modifié
  if (current) {
    const changes: Array<{ field: string; old_value: string | null; new_value: string | null }> = [];
    for (const [field, value] of Object.entries(parsed.data)) {
      const oldVal = (current as Record<string, unknown>)[field];
      if (oldVal !== value) {
        changes.push({
          field,
          old_value: oldVal != null ? String(oldVal) : null,
          new_value: value != null ? String(value) : null,
        });
      }
    }
    if (changes.length > 0) {
      await supabase.from("portal_self_updates").insert(
        changes.map((c) => ({
          company_id: ctx.companyId,
          employee_id: ctx.employeeId,
          field: c.field,
          old_value: c.old_value,
          new_value: c.new_value,
          user_id: ctx.userId,
        }))
      );
    }
  }

  return NextResponse.json(updated);
}
