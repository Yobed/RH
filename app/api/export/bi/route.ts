import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Dataset = "employees" | "payroll" | "conges" | "evaluations" | "all";

export async function GET(req: NextRequest) {
  // Auth : session Supabase ou API key
  let companyId: string | null = null;

  const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
  if (apiKey) {
    const { data: co } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("api_key", apiKey)
      .single();
    companyId = co?.id ?? null;
  } else {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const { data: cid } = await supabase.rpc("get_user_company_id");
    companyId = cid as string | null;
  }

  if (!companyId) return NextResponse.json({ error: "Société introuvable" }, { status: 403 });

  const dataset = (req.nextUrl.searchParams.get("dataset") ?? "employees") as Dataset;

  const result: Record<string, unknown[]> = {};

  if (dataset === "employees" || dataset === "all") {
    const { data } = await supabaseAdmin
      .from("employees")
      .select("id, full_name, departement, poste, type_contrat, salaire_base, date_embauche, statut, genre")
      .eq("company_id", companyId);
    result.employees = data ?? [];
  }

  if (dataset === "payroll" || dataset === "all") {
    const { data } = await supabaseAdmin
      .from("payroll_bulletins")
      .select("employee_id, mois, salaire_brut, salaire_net, charges_patronales")
      .eq("company_id", companyId)
      .order("mois", { ascending: false })
      .limit(1000);
    result.payroll = data ?? [];
  }

  if (dataset === "conges" || dataset === "all") {
    const { data } = await supabaseAdmin
      .from("conges")
      .select("employee_id, date_debut, date_fin, type, nb_jours, statut")
      .eq("company_id", companyId)
      .limit(1000);
    result.conges = data ?? [];
  }

  if (dataset === "evaluations" || dataset === "all") {
    const { data } = await supabaseAdmin
      .from("evaluations")
      .select("employee_id, date_evaluation, note_globale, statut, type_evaluation")
      .eq("company_id", companyId)
      .limit(1000);
    result.evaluations = data ?? [];
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    company_id: companyId,
    ...result,
  });
}
