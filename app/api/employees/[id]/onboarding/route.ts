import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildDefaultChecklist, type OnboardingItem } from "@/lib/onboarding-template";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      category: z.enum(["legal", "admin", "technique", "humain"]),
      title: z.string(),
      description: z.string(),
      legal_ref: z.string().optional(),
      done: z.boolean(),
      done_at: z.string().nullable().optional(),
      done_by: z.string().nullable().optional(),
      due_offset_days: z.number().optional(),
      resource: z.object({ type: z.string(), id: z.string().optional() }).optional(),
    })
  ),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const { data: existing } = await supabase
    .from("onboarding_checklists")
    .select("items, completed_at, created_at")
    .eq("employee_id", params.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(existing);
  }

  // Création paresseuse à la première lecture
  const items = buildDefaultChecklist();
  const { data: created, error } = await supabase
    .from("onboarding_checklists")
    .insert({
      company_id: companyId as string,
      employee_id: params.id,
      items,
    })
    .select("items, completed_at, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(created);
}

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

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const items = parsed.data.items as OnboardingItem[];
  const allDone = items.length > 0 && items.every((i) => i.done);

  const { data, error } = await supabase
    .from("onboarding_checklists")
    .upsert(
      {
        company_id: companyId as string,
        employee_id: params.id,
        items,
        completed_at: allDone ? new Date().toISOString() : null,
      },
      { onConflict: "employee_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
