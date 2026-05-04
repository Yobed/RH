import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Société introuvable" }, { status: 404 });

  const { data: integration } = await supabase
    .from("company_integrations")
    .select("whatsapp_webhook_url, whatsapp_enabled")
    .eq("company_id", companyId as string)
    .single();

  if (!integration?.whatsapp_enabled || !integration?.whatsapp_webhook_url) {
    return NextResponse.json({ success: false, error: "WhatsApp non configuré ou désactivé" }, { status: 400 });
  }

  try {
    const res = await fetch(integration.whatsapp_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template: "test",
        message: "Test de configuration WhatsApp — RH Manager CI",
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json({ success: res.ok });
  } catch {
    return NextResponse.json({ success: false });
  }
}
