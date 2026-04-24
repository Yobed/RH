import { createServerClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { AnalytiqueDashboard } from "./AnalytiqueDashboard";

export const metadata = {
  title: "Analytique RH | RH Manager CI",
  description: "Tableaux de bord des indicateurs RH",
};

export default async function AnalytiquePage() {
  const supabase = createServerClient();

  // On récupère toutes les données nécessaires (sans restriction si RLS activé, ou filtré par company_id s'il le faut manuellement)
  // Comme RLS est activé et géré, on peut directement requêter
  const { data: employees, error: errEmployees } = await supabase
    .from("employees")
    .select("id, full_name, date_embauche, date_naissance, genre, statut");

  const { data: bulletins, error: errBulletins } = await supabase
    .from("bulletins_paie")
    .select("id, periode, salaire_brut, salaire_net, its, cnps_salarie, prime_transport, sursalaire, details");

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
    console.error("Erreur de récupération des données analytiques", { errEmployees, errBulletins, errContracts, errConges, errMedical });
    return (
      <div className="p-8 text-center text-red-500">
        Erreur lors du chargement des données analytiques. Veuillez réessayer ultérieurement.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytique RH</h1>
        <p className="text-slate-500 mt-1">
          Indicateurs de performance, effectifs et masse salariale
        </p>
      </div>

      <Suspense fallback={<div className="h-96 flex items-center justify-center">Chargement des graphiques...</div>}>
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
