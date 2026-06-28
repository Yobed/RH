import { createServerClient } from "@/lib/supabase/server";
import { SimulateurMasseSalariale } from "@/components/rh/SimulateurMasseSalariale";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

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
    <PageShell>
      <PageHeader
        title="Prévision N+1"
        description="Simulation de la masse salariale pour l'année suivante selon différents scénarios."
      />
      <SimulateurMasseSalariale
        masseSalarialeActuelle={masseSalariale}
        effectifActuel={employees?.length ?? 0}
        anneeActuelle={new Date().getFullYear()}
      />
    </PageShell>
  );
}
