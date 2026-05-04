const N8N_BASE_URL = process.env.N8N_BASE_URL ?? "https://yobed-n8n-supabase-claude.hf.space";
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

export type WhatsAppTemplate =
  | "bulletin_disponible"
  | "conge_approuve"
  | "conge_refuse"
  | "rappel_signature"
  | "alerte_contrat_expiration"
  | "bienvenue_portail";

export interface WhatsAppPayload {
  phone: string;
  template: WhatsAppTemplate;
  variables: Record<string, string>;
}

export async function sendWhatsApp(payload: WhatsAppPayload): Promise<boolean> {
  try {
    const res = await fetch(`${N8N_BASE_URL}/webhook/whatsapp-rh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const WHATSAPP_TEMPLATES: Record<WhatsAppTemplate, string> = {
  bulletin_disponible: "Bonjour {{prenom}}, votre bulletin de paie {{mois}} est disponible sur le portail RH. Connectez-vous sur {{url}}",
  conge_approuve: "Bonjour {{prenom}}, votre demande de congé du {{date_debut}} au {{date_fin}} a été approuvée.",
  conge_refuse: "Bonjour {{prenom}}, votre demande de congé du {{date_debut}} au {{date_fin}} a été refusée. Motif : {{motif}}",
  rappel_signature: "Bonjour {{prenom}}, un document nécessite votre signature : {{document_titre}}. Connectez-vous sur {{url}}",
  alerte_contrat_expiration: "Information RH : Le contrat de {{employe}} expire le {{date_fin}}. Action requise.",
  bienvenue_portail: "Bienvenue chez {{entreprise}} ! Votre compte portail RH est créé. Connectez-vous : {{url}} — Identifiant : {{email}}",
};
