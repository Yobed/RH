import { createServerClient } from "@/lib/supabase/server";
import { SimulateurMasseSalariale } from "@/components/rh/SimulateurMasseSalariale";

export const metadata = { title: "Prévision masse salariale — RH Manager CI" };

export default async function PrevisionPage() {
  const supabase = createServerClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("salaire_brut, statut")
    .eq("statut", "actif");

  const masseSalariale = (employees ?? []).reduce(
    (sum, e) => sum + (e.salaire_brut ?? 0),
    0
  );

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Prévision N+1</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulation de la masse salariale pour l'année suivante selon différents scénarios.
        </p>
      </div>
      <SimulateurMasseSalariale
        masseSalarialeActuelle={masseSalariale}
        effectifActuel={employees?.length ?? 0}
        anneeActuelle={new Date().getFullYear()}
      />
    </div>
  );
}
