export const dynamic = "force-dynamic";
import { createServerClient } from "@/lib/supabase/server";
import { MasseSalarialeDashboard } from "@/components/paie/MasseSalarialeDashboard";
import { TrendingUp, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Masse salariale — RH Manager CI" };

export default async function MasseSalarialeePage({
  searchParams,
}: {
  searchParams: { periode?: string };
}) {
  const supabase = createServerClient();

  // Période par défaut = mois courant, filtrable via ?periode=YYYY-MM
  const periodeParam = searchParams.periode;
  const currentPeriode = new Date().toISOString().slice(0, 7);
  const periode = periodeParam ?? currentPeriode;

  const { data: bulletins } = await supabase
    .from("bulletins_paie")
    .select(
      `id, periode, salaire_brut, cnps_salarie, its, salaire_net, statut,
       sursalaire, prime_anciennete, prime_exceptionnelle, prime_salissure,
       prime_depassement, prime_fonction, prime_transport,
       employees(full_name, poste, matricule)`
    )
    .eq("periode", periode)
    .order("created_at", { ascending: false });

  // Générer les 12 derniers mois pour le sélecteur
  const moisDisponibles: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    moisDisponibles.push(d.toISOString().slice(0, 7));
  }

  const bulletinsData = (bulletins ?? []).map((b) => ({
    ...b,
    employees: Array.isArray(b.employees) ? b.employees[0] ?? null : b.employees,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/paie"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la paie
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Masse Salariale</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Coûts salariaux globaux — charges patronales CNPS CI 2026
          </p>
        </div>

        {/* Sélecteur de période */}
        <form method="get" className="flex items-center gap-2">
          <label
            htmlFor="periode"
            className="text-sm text-muted-foreground whitespace-nowrap"
          >
            Période :
          </label>
          <select
            id="periode"
            name="periode"
            defaultValue={periode}
            className="rounded-md border bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            onChange={(e) => {
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("periode", e.target.value);
                window.location.href = url.toString();
              }
            }}
          >
            {moisDisponibles.map((m) => (
              <option key={m} value={m}>
                {new Date(m + "-01").toLocaleDateString("fr-CI", {
                  month: "long",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </form>
      </div>

      {/* Rappel légal */}
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Charges patronales CNPS CI — Références 2026</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
          <span>Retraite patronale : <strong>7,7%</strong> (plafond 1 647 315 FCFA)</span>
          <span>Prestations familiales : <strong>5%</strong> (plafond 70 000 FCFA)</span>
          <span>Accidents maternité : <strong>0,75%</strong></span>
          <span>AT/MP : <strong>3%</strong> (taux moyen — variable par secteur)</span>
          <span>FDFP : <strong>1%</strong> masse salariale</span>
          <span>CMU patronale : <strong>1 600 FCFA</strong> forfait/salarié</span>
        </div>
      </div>

      {/* Dashboard */}
      {bulletinsData.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <TrendingUp className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">
            Aucun bulletin pour la période {periode}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Générez des bulletins de paie pour voir la masse salariale.
          </p>
        </div>
      ) : (
        <MasseSalarialeDashboard bulletins={bulletinsData} periode={periode} />
      )}
    </div>
  );
}
