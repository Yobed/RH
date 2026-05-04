const N8N_BASE_URL = process.env.N8N_BASE_URL ?? "https://yobed-n8n-supabase-claude.hf.space";

export type MobileMoneyProvider = "orange_money" | "wave" | "mtn_momo";

export interface MobileMoneyPayment {
  provider: MobileMoneyProvider;
  phone: string;
  amount: number;
  reference: string;
  description: string;
  employeeId: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message: string;
  provider: MobileMoneyProvider;
}

export async function initiateMobileMoneyPayment(
  payment: MobileMoneyPayment
): Promise<PaymentResult> {
  try {
    const res = await fetch(`${N8N_BASE_URL}/webhook/mobile-money-paiement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({
        provider: payment.provider,
        phone: payment.phone,
        amount: payment.amount,
        reference: payment.reference,
        description: payment.description,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json() as { transactionId?: string };
      return {
        success: true,
        transactionId: data.transactionId ?? `SIM-${Date.now()}`,
        message: "Paiement initié avec succès",
        provider: payment.provider,
      };
    }
    return { success: false, message: "Erreur lors de l'initiation", provider: payment.provider };
  } catch {
    return { success: false, message: "Service indisponible", provider: payment.provider };
  }
}

export const PROVIDER_LABELS: Record<MobileMoneyProvider, { label: string; color: string; prefix: string[] }> = {
  orange_money: { label: "Orange Money", color: "#FF6600", prefix: ["07", "08"] },
  wave: { label: "Wave", color: "#1BA8FF", prefix: ["01"] },
  mtn_momo: { label: "MTN MoMo", color: "#FFCC00", prefix: ["05", "06"] },
};

export function detectProvider(phone: string): MobileMoneyProvider | null {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  const prefix = local.slice(0, 2);
  if (["07", "08"].includes(prefix)) return "orange_money";
  if (["01"].includes(prefix)) return "wave";
  if (["05", "06"].includes(prefix)) return "mtn_momo";
  return null;
}
