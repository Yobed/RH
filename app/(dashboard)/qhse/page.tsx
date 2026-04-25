import { createServerClient } from "@/lib/supabase/server";
import { QhseClient } from "./QhseClient";

export const dynamic = "force-dynamic";

export default async function QhsePage() {
  const supabase = createServerClient();
  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();

  const [accidentsRes, visitesRes, indicateursRes] = await Promise.all([
    supabase
      .from("work_accidents")
      .select(`id, date_accident, heure_accident, lieu, description, gravite, jours_arret, statut_cnps, numero_cnps,
               employees(full_name, poste, matricule)`)
      .order("date_accident", { ascending: false }),
    supabase
      .from("medical_visits")
      .select(`id, type_visite, date_visite, date_prochaine, resultat, medecin, observations,
               employees(full_name, poste, matricule)`)
      .order("date_prochaine", { ascending: true }),
    supabase
      .from("work_accidents")
      .select("id, gravite, jours_arret, statut_cnps")
      .gte("date_accident", `${currentYear}-01-01`),
  ]);

  const accidents = accidentsRes.data ?? [];
  const visitesRaw = visitesRes.data ?? [];
  const accAnne = indicateursRes.data ?? [];

  const visites = visitesRaw.map((v) => ({
    ...v,
    en_retard: v.date_prochaine ? v.date_prochaine < today : false,
  }));

  const effectifRes = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("statut", "actif");

  const effectif = effectifRes.count ?? 0;
  const heuresTravaillees = effectif * 2000;
  const totalJoursArret = accAnne.reduce((s, a) => s + (a.jours_arret ?? 0), 0);

  const indicateurs = {
    annee: currentYear,
    effectif,
    nb_accidents: accAnne.length,
    taux_frequence: heuresTravaillees > 0
      ? Math.round((accAnne.length / heuresTravaillees) * 1_000_000 * 10) / 10
      : 0,
    taux_gravite: heuresTravaillees > 0
      ? Math.round((totalJoursArret / heuresTravaillees) * 1_000 * 10) / 10
      : 0,
    total_jours_arret: totalJoursArret,
    visites_en_retard: visites.filter((v) => v.en_retard).length,
    accidents_non_declares: accAnne.filter((a) => a.statut_cnps === "non_declare").length,
    repartition_gravite: {
      benin: accAnne.filter((a) => a.gravite === "bénin").length,
      grave: accAnne.filter((a) => a.gravite === "grave").length,
      mortel: accAnne.filter((a) => a.gravite === "mortel").length,
    },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">QHSE</h1>
        <p className="text-sm text-slate-600 mt-1">
          Registre accidents du travail · Visites médicales · Indicateurs sinistralité
        </p>
      </div>
      <QhseClient
        accidents={accidents as unknown as Parameters<typeof QhseClient>[0]["accidents"]}
        visites={visites as unknown as Parameters<typeof QhseClient>[0]["visites"]}
        indicateurs={indicateurs}
      />
    </div>
  );
}
