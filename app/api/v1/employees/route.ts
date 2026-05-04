import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!apiKey) {
    return NextResponse.json({ error: "API key requise" }, { status: 401 });
  }

  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("api_key", apiKey)
    .single();

  if (!company) {
    return NextResponse.json({ error: "API key invalide" }, { status: 403 });
  }

  const params = req.nextUrl.searchParams;
  const statut = params.get("statut") ?? "actif";
  const departement = params.get("departement");
  const limit = Math.min(Number(params.get("limit") ?? 100), 500);
  const offset = Number(params.get("offset") ?? 0);

  let query = supabaseAdmin
    .from("employees")
    .select("id, full_name, poste, departement, type_contrat, salaire_base, date_embauche, statut, genre")
    .eq("company_id", company.id)
    .eq("statut", statut)
    .range(offset, offset + limit - 1);

  if (departement) query = query.eq("departement", departement);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    meta: { total: count ?? data?.length ?? 0, limit, offset },
  });
}
