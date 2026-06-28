import { PageShell } from "@/components/ui/page-shell";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BordereauClient } from "./BordereauClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bordereau de virement — RH Manager CI" };

export default async function BordereauPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) redirect("/onboarding");

  const [{ data: bulletinsPeriods }, { data: bordereaux }] = await Promise.all([
    supabase
      .from("bulletins_paie")
      .select("periode")
      .eq("company_id", companyId as string)
      .order("periode", { ascending: false }),
    supabase
      .from("bank_transfers")
      .select("id, periode, format_export, total_montant, nb_virements, nb_rib_manquants, date_generation, date_envoi, banque_destinatrice")
      .eq("company_id", companyId as string)
      .order("date_generation", { ascending: false })
      .limit(20),
  ]);

  const periods = Array.from(new Set((bulletinsPeriods ?? []).map((b) => b.periode))).sort().reverse();

  return (
    <PageShell>
      <BordereauClient periods={periods} bordereaux={bordereaux ?? []} />
    </PageShell>
  );
}
