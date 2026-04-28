export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { CompanySocialAnalysis } from "@/components/rh/CompanySocialAnalysis";

export const metadata = { title: "Finance & Data RH — RH Manager CI" };

export default async function FinanceDataPage() {
  const supabase = createServerClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, departement, categorie, salaire_brut, sursalaire, prime_transport, prime_fonction, statut")
    .eq("statut", "actif");

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <CompanySocialAnalysis employees={employees || []} />
    </div>
  );
}
