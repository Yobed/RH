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
    .select("id, full_name, date_embauche, date_naissance, genre, statut, departement, categorie");

  const { data: bulletins, error: errBulletins } = await supabase
    .from("bulletins_paie")
    .select("id, employee_id, periode, salaire_brut, salaire_net, its, cnps_salarie, prime_transport, sursalaire, total_contributions, net_to_pay, tax_cn, tax_igr, withholding_cnps");

  const { data: contracts, error: errContracts } = await supabase
    .from("contracts")
    .select("employee_id, date_debut, date_fin, statut");

  const { data: conges, error: errConges } = await supabase
    .from("conges")
    .select("employee_id, date_debut, date_fin, nb_jours, statut, type");

  const { data: medical, error: errMedical } = await supabase
    .from("medical_exams")
    .select("id, employee_id, resultat, prochaine_visite");

  const { data: jobPostings, error: errJobs } = await supabase
    .from("job_postings")
    .select("id, titre, created_at, statut, date_limite");

  const { data: candidates, error: errCandidates } = await supabase
    .from("candidates")
    .select("id, job_id, created_at, statut, score_ia");

  const { data: evaluations, error: errEvals } = await supabase
    .from("evaluations")
    .select("id, employee_id, score_global, potential_score, date_realisation, type, statut");

  const { data: accidents, error: errAccidents } = await supabase
    .from("work_accidents")
    .select("id, employee_id, date_accident, jours_arret, gravite");

  if (errEmployees || errBulletins || errContracts || errConges || errMedical || errJobs || errCandidates || errEvals || errAccidents) {
    console.error("Erreur de récupération des données analytiques", {
      errEmployees,
      errBulletins,
      errContracts,
      errConges,
      errMedical,
      errJobs,
      errCandidates,
      errEvals,
      errAccidents
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
    <div className="p-3 sm:p-6 md:p-8 space-y-6">
      <Suspense
        fallback={
          <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] p-16 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[oklch(0.175_0.04_248)]" />
              <p className="text-sm text-slate-600 font-medium">Chargement du dashboard analytique expert…</p>
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
          jobPostings={jobPostings || []}
          candidates={candidates || []}
          evaluations={evaluations || []}
          accidents={accidents || []}
        />
      </Suspense>
    </div>
  );
}
