import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { detectAnomalies } from "@/lib/anomalies-engine";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const anomalies = await detectAnomalies(supabase, companyId as string);
  return NextResponse.json(anomalies);
}
