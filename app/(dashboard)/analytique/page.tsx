import { createServerClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { AnalytiqueDashboard } from "./AnalytiqueDashboard";

export const metadata = {
  title: "Analytique RH | RH Manager CI",
  description: "Tableaux de bord des indicateurs RH",
};

export default async function AnalytiquePage() {
  const supabase = createServerClient();

  const { data: employees, error: errEmployees } = await supabase
    .from("employees")
    .select("id, full_name, date_embauche, date_naissance, genre, statut");

  const { data: bulletins, error: errBulletins } = await supabase
    .from("bulletins_paie")
    .select("id, periode, salaire_brut, salaire_net, its, cnps_salarie, prime_transport, sursalaire");

  const { data: contracts, error: errContracts } = await supabase
    .from("contracts")
    .select("employee_id, date_debut, date_fin, statut");

  const { data: conges, error: errConges } = await supabase
    .from("conges")
    .select("employee_id, date_debut, date_fin, nb_jours, statut, type");

  const { data: medical, error: errMedical } = await supabase
    .from("medical_exams")
    .select("id, employee_id, resultat, prochaine_visite");

  if (errEmployees || errBulletins || errContracts || errConges || errMedical) {
    console.error("Erreur de récupération des données analytiques", {
      errEmployees,
      errBulletins,
      errContracts,
      errConges,
      errMedical,
    });
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-10 text-center">
          <p className="text-sm font-semibold text-rose-600">
            Erreur lors du chargement des données analytiques. Veuillez réessayer ultérieurement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytique RH</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Indicateurs de performance, effectifs et masse salariale
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] p-16 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[oklch(0.175_0.04_248)]" />
              <p className="text-sm text-slate-600 font-medium">Chargement des graphiques…</p>
            </div>
          </div>
        }
      >
        <AnalytiqueDashboard
          employees={employees || []}
          bulletins={bulletins || []}
          contracts={contracts || []}
          conges={conges || []}
          medical={medical || []}
        />
      </Suspense>
    </div>
  );
}
