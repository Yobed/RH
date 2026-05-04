import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { initiateMobileMoneyPayment, type MobileMoneyProvider } from "@/lib/mobile-money";

interface Body {
  bulletinId?: string;
  employeeId: string;
  provider: MobileMoneyProvider;
  phone: string;
  amount: number;
  employeeName?: string;
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Société introuvable" }, { status: 400 });

  const body = await req.json() as Body;
  const { bulletinId, employeeId, provider, phone, amount, employeeName } = body;

  const now = new Date();
  const reference = `PAIE-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${employeeId.slice(0, 6).toUpperCase()}`;

  const result = await initiateMobileMoneyPayment({
    provider,
    phone,
    amount,
    reference,
    description: `Salaire ${now.toLocaleDateString("fr-CI", { month: "long", year: "numeric" })} — ${employeeName ?? employeeId}`,
    employeeId,
  });

  // Persister le paiement
  await supabase.from("mobile_money_payments").insert({
    company_id: companyId as string,
    employee_id: employeeId,
    bulletin_id: bulletinId ?? null,
    provider,
    phone,
    amount,
    reference,
    statut: result.success ? "initie" : "echec",
    transaction_id: result.transactionId ?? null,
    details: { message: result.message },
  });

  return NextResponse.json(result);
}
