import { createServerClient } from "@/lib/supabase/server";
import { RisqueDepartTable } from "@/components/rh/RisqueDepartTable";
import type { RisqueDepart } from "@/app/api/analytics/risque-depart/route";

export const metadata = { title: "Risque de départ — RH Manager CI" };

export default async function RisqueDepartPage() {
  const supabase = createServerClient();
  const now = new Date();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, poste, departement, date_embauche, salaire_brut, statut")
    .eq("statut", "actif");

  const data: RisqueDepart[] = (employees ?? []).map((e) => {
    const embauche = e.date_embauche ? new Date(e.date_embauche) : null;
    const ancienneteAns = embauche
      ? (now.getTime() - embauche.getTime()) / (1000 * 60 * 60 * 24 * 365)
      : 0;

    const facteurs: string[] = [];
    let score = 0;

    if (ancienneteAns < 1) { score += 30; facteurs.push("Ancienneté < 1 an"); }
    else if (ancienneteAns > 5) { score += 10; }

    if (e.salaire_brut && e.salaire_brut < 150_000) { score += 25; facteurs.push("Salaire < 150k FCFA"); }
    else if (e.salaire_brut && e.salaire_brut < 300_000) { score += 10; }

    if (!e.poste) { score += 10; facteurs.push("Poste non défini"); }

    const niveau: RisqueDepart["niveau"] =
      score >= 70 ? "critique" : score >= 45 ? "eleve" : score >= 20 ? "modere" : "faible";

    return {
      employee_id: e.id,
      full_name: e.full_name ?? `${e.id}`,
      poste: e.poste ?? "—",
      departement: e.departement ?? "—",
      score,
      niveau,
      facteurs,
    };
  });

  data.sort((a, b) => b.score - a.score);

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Risque de départ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyse prédictive du turnover — score calculé sur ancienneté, salaire et profil.
        </p>
      </div>
      <RisqueDepartTable data={data} />
    </div>
  );
}
