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

  const { data: employee } = await supabase
    .from("employees")
    .select("telephone, full_name")
    .eq("id", employeeId)
    .single();

  if (!employee?.telephone) {
    return NextResponse.json({ error: "Numéro de téléphone manquant" }, { status: 400 });
  }

  const success = await sendWhatsApp({
    phone: employee.telephone,
    template,
    variables: { prenom: employee.full_name?.split(" ")[0] ?? "", ...variables },
  });

  // Log dans notifications si la table existe
  try {
    await supabase.from("notifications").insert({
      user_id: user.id,
      titre: `WhatsApp envoyé à ${employee.full_name}`,
      contenu: `Template: ${template}`,
      type: "whatsapp",
      statut: success ? "envoye" : "echec",
    });
  } catch {
    // Silencieux si la table notifications n'existe pas encore
  }

  return NextResponse.json({ success, employee: employee.full_name });
}
