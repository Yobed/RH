const WASENDER_API_URL = "https://www.wasenderapi.com/api/send-message";

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

export const WHATSAPP_TEMPLATES: Record<WhatsAppTemplate, string> = {
  bulletin_disponible:
    "Bonjour {{prenom}}, votre bulletin de paie {{mois}} est disponible sur le portail RH. Connectez-vous sur {{url}}",
  conge_approuve:
    "Bonjour {{prenom}}, votre demande de congé du {{date_debut}} au {{date_fin}} a été approuvée.",
  conge_refuse:
    "Bonjour {{prenom}}, votre demande de congé du {{date_debut}} au {{date_fin}} a été refusée. Motif : {{motif}}",
  rappel_signature:
    "Bonjour {{prenom}}, un document nécessite votre signature : {{document_titre}}. Connectez-vous sur {{url}}",
  alerte_contrat_expiration:
    "Information RH : Le contrat de {{employe}} expire le {{date_fin}}. Action requise.",
  bienvenue_portail:
    "Bienvenue chez {{entreprise}} ! Votre compte portail RH est créé. Connectez-vous : {{url}} — Identifiant : {{email}}",
};

function buildMessage(template: WhatsAppTemplate, variables: Record<string, string>): string {
  let msg = WHATSAPP_TEMPLATES[template];
  for (const [key, value] of Object.entries(variables)) {
    msg = msg.replaceAll(`{{${key}}}`, value);
  }
  return msg;
}

export async function sendWhatsApp(
  payload: WhatsAppPayload,
  apiKey?: string,
): Promise<boolean> {
  const key = apiKey ?? process.env.WASENDER_API_KEY;
  if (!key) return false;

  const text = buildMessage(payload.template, payload.variables);

  try {
    const res = await fetch(WASENDER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ to: payload.phone, text }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
