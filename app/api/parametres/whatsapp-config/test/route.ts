import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Société introuvable" }, { status: 404 });

  const { data: integration } = await supabase
    .from("company_integrations")
    .select("whatsapp_webhook_url, whatsapp_access_token, whatsapp_enabled")
    .eq("company_id", companyId as string)
    .single();

  if (!integration?.whatsapp_enabled || !integration?.whatsapp_access_token) {
    return NextResponse.json({ success: false, error: "Wassender non configuré ou désactivé" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({})) as { phone?: string };
  const phone = body.phone ?? integration.whatsapp_webhook_url;

  if (!phone) {
    return NextResponse.json({ success: false, error: "Numéro de test manquant" }, { status: 400 });
  }

  const success = await sendWhatsApp(
    {
      phone,
      template: "bienvenue_portail",
      variables: {
        prenom: "Test",
        entreprise: "RH Manager CI",
        url: "https://rh-manager-ci.vercel.app",
        email: user.email ?? "test@example.com",
      },
    },
    integration.whatsapp_access_token,
  );

  return NextResponse.json({ success });
}
