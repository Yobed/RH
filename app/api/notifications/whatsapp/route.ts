import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendWhatsApp, type WhatsAppTemplate } from "@/lib/whatsapp";

interface Body {
  employeeId: string;
  template: WhatsAppTemplate;
  variables: Record<string, string>;
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json() as Body;
  const { employeeId, template, variables } = body;

  const { data: companyId } = await supabase.rpc("get_user_company_id");

  const [{ data: employee }, { data: integration }] = await Promise.all([
    supabase
      .from("employees")
      .select("telephone, full_name")
      .eq("id", employeeId)
      .single(),
    companyId
      ? supabase
          .from("company_integrations")
          .select("whatsapp_access_token, whatsapp_enabled")
          .eq("company_id", companyId as string)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  if (!employee?.telephone) {
    return NextResponse.json({ error: "Numéro de téléphone manquant" }, { status: 400 });
  }

  if (!integration?.whatsapp_enabled || !integration?.whatsapp_access_token) {
    return NextResponse.json({ error: "Wassender non configuré" }, { status: 400 });
  }

  const success = await sendWhatsApp(
    {
      phone: employee.telephone,
      template,
      variables: { prenom: employee.full_name?.split(" ")[0] ?? "", ...variables },
    },
    integration.whatsapp_access_token,
  );

  try {
    await supabase.from("notifications").insert({
      user_id: user.id,
      titre: `Wassender envoyé à ${employee.full_name}`,
      contenu: `Template: ${template}`,
      type: "whatsapp",
      statut: success ? "envoye" : "echec",
    });
  } catch {
    // Silencieux si la table notifications n'existe pas encore
  }

  return NextResponse.json({ success, employee: employee.full_name });
}
