import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  sage_employee_id: z.string().min(1, "Matricule Sage requis"),
  employee_id: z.string().uuid("UUID employé SIRH invalide"),
});

async function getCompanyId(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .limit(1)
    .maybeSingle();
  return data?.company_id ?? null;
}

export async function GET() {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const companyId = await getCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

  const { data, error } = await supabase
    .from("sage_employee_mapping")
    .select(`
      id,
      sage_employee_id,
      employee_id,
      employees (
        id,
        full_name,
        matricule
      )
    `)
    .eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const companyId = await getCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { sage_employee_id, employee_id } = parsed.data;

  const { data, error } = await supabase
    .from("sage_employee_mapping")
    .upsert(
      { company_id: companyId, sage_employee_id, employee_id },
      { onConflict: "company_id,sage_employee_id" }
    )
    .select()
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const companyId = await getCompanyId(supabase, user.id);
  if (!companyId) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

  const sageId = req.nextUrl.searchParams.get("sage_id");
  if (!sageId) return NextResponse.json({ error: "Paramètre sage_id manquant" }, { status: 400 });

  const { error } = await supabase
    .from("sage_employee_mapping")
    .delete()
    .eq("company_id", companyId)
    .eq("sage_employee_id", sageId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
