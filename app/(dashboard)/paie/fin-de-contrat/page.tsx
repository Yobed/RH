export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { SoldeToutCompteForm } from "@/components/rh/SoldeToutCompteForm";

export const metadata = { title: "Solde de Tout Compte — RH Manager CI" };

export default async function FinDeContratPage({
  searchParams,
}: {
  searchParams: { employeeId?: string };
}) {
  const supabase = createServerClient();
  const defaultEmployeeId = searchParams?.employeeId;

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, matricule, salaire_brut, type_contrat, date_embauche")
    .eq("statut", "actif")
    .order("full_name");

  const { data: company } = await supabase.from("companies").select("*").single();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Solde de Tout Compte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simulez le calcul de fin de contrat (précarité, licenciement, congés) selon les lois ivoiriennes.
          </p>
        </div>
      </div>
      <SoldeToutCompteForm 
        employees={employees ?? []} 
        company={company} 
        defaultEmployeeId={defaultEmployeeId}
      />
    </div>
  );
}
