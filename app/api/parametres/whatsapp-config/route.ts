import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({});

  const { data } = await supabase
    .from("company_integrations")
    .select("whatsapp_webhook_url, whatsapp_access_token, whatsapp_enabled")
    .eq("company_id", companyId as string)
    .single();

  return NextResponse.json({
    api_key: data?.whatsapp_access_token ?? "",
    test_phone: data?.whatsapp_webhook_url ?? "",
    enabled: data?.whatsapp_enabled ?? false,
  });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Société introuvable" }, { status: 404 });

  const body = await req.json() as { test_phone?: string; api_key?: string; enabled?: boolean };

  const { error } = await supabase
    .from("company_integrations")
    .upsert({
      company_id: companyId,
      whatsapp_webhook_url: body.test_phone,
      whatsapp_access_token: body.api_key,
      whatsapp_enabled: body.enabled ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "company_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
