import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;

  const [accidentsRes, visitesRes, employeesRes] = await Promise.all([
    supabase
      .from("work_accidents")
      .select("id, date_accident, gravite, jours_arret, statut_cnps")
      .gte("date_accident", yearStart),
    supabase
      .from("medical_visits")
      .select("id, date_prochaine, resultat")
      .not("date_prochaine", "is", null),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("statut", "actif"),
  ]);

  const accidents = accidentsRes.data ?? [];
  const visites = visitesRes.data ?? [];
  const effectif = employeesRes.count ?? 0;

  const today = new Date().toISOString().split("T")[0];

  // Taux de fréquence = (nb accidents / heures travaillées) × 1 000 000
  // Estimation : effectif × 2000h/an
  const heuresTravaillees = effectif * 2000;
  const tauxFrequence = heuresTravaillees > 0
    ? Math.round((accidents.length / heuresTravaillees) * 1_000_000 * 10) / 10
    : 0;

  // Taux de gravité = (nb jours d'arrêt / heures travaillées) × 1 000
  const totalJoursArret = accidents.reduce((s, a) => s + (a.jours_arret ?? 0), 0);
  const tauxGravite = heuresTravaillees > 0
    ? Math.round((totalJoursArret / heuresTravaillees) * 1_000 * 10) / 10
    : 0;

  const visitesEnRetard = visites.filter((v) => v.date_prochaine && v.date_prochaine < today).length;
  const accidentsNonDeclares = accidents.filter((a) => a.statut_cnps === "non_declare").length;

  return NextResponse.json({
    annee: currentYear,
    effectif,
    nb_accidents: accidents.length,
    taux_frequence: tauxFrequence,
    taux_gravite: tauxGravite,
    total_jours_arret: totalJoursArret,
    visites_en_retard: visitesEnRetard,
    accidents_non_declares: accidentsNonDeclares,
    repartition_gravite: {
      benin: accidents.filter((a) => a.gravite === "bénin").length,
      grave: accidents.filter((a) => a.gravite === "grave").length,
      mortel: accidents.filter((a) => a.gravite === "mortel").length,
    },
  });
}
