export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { SoldeToutCompteForm } from "@/components/rh/SoldeToutCompteForm";
import Link from "next/link";

export const metadata = { title: "Solde de Tout Compte — RH Manager CI" };

export default async function FinDeContratPage({
  searchParams,
}: {
  searchParams: { employeeId?: string };
}) {
  const supabase = createServerClient();
  const defaultEmployeeId = searchParams?.employeeId;

  const [{ data: employees }, { data: company }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, salaire_brut, type_contrat, date_embauche")
      .eq("statut", "actif")
      .order("full_name"),
    supabase.from("companies").select("*").single(),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <Link
            href="/paie"
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-600 transition-colors mb-2"
          >
            ← Retour à la paie
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Solde de Tout Compte</h1>
          <p className="text-sm text-slate-600 mt-0.5 font-medium">
            Simulation fin de contrat — précarité, licenciement, congés selon lois ivoiriennes
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
