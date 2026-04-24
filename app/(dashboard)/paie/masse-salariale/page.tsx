export const dynamic = "force-dynamic";
import { createServerClient } from "@/lib/supabase/server";
import { MasseSalarialeDashboard } from "@/components/paie/MasseSalarialeDashboard";
import Link from "next/link";

export const metadata = { title: "Masse salariale — RH Manager CI" };

export default async function MasseSalarialeePage({
  searchParams,
}: {
  searchParams: { periode?: string };
}) {
  const supabase = createServerClient();

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <Link
            href="/paie"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-2"
          >
            ← Retour à la paie
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Masse Salariale</h1>
          <p className="text-sm text-slate-400 mt-0.5 font-medium">
            Coûts salariaux globaux — charges patronales CNPS CI 2026
          </p>
        </div>

        <form method="get" className="shrink-0 flex items-center gap-2">
          <label htmlFor="periode" className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Période
          </label>
          <select
            id="periode"
            name="periode"
            defaultValue={periode}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[oklch(0.38_0.10_252/0.3)]"
          >
            {moisDisponibles.map((m) => (
              <option key={m} value={m}>
                {new Date(m + "-01").toLocaleDateString("fr-CI", { month: "long", year: "numeric" })}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[oklch(0.175_0.04_248)] px-3 py-1.5 text-xs font-semibold text-[oklch(0.78_0.13_73)] hover:opacity-90 transition-opacity"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Rappel légal */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Charges patronales CNPS CI — Références 2026</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-3">
          <span>Retraite patronale : <strong>7,7%</strong> (plafond 1 647 315 FCFA)</span>
          <span>Prestations familiales : <strong>5%</strong> (plafond 70 000 FCFA)</span>
          <span>Accidents maternité : <strong>0,75%</strong></span>
          <span>AT/MP : <strong>3%</strong> (taux moyen — variable par secteur)</span>
          <span>FDFP : <strong>1%</strong> masse salariale</span>
          <span>CMU patronale : <strong>1 600 FCFA</strong> forfait/salarié</span>
        </div>
      </div>

      {bulletinsData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm font-medium text-slate-500">Aucun bulletin pour la période {periode}</p>
          <p className="mt-1 text-xs text-slate-400">Générez des bulletins de paie pour voir la masse salariale.</p>
        </div>
      ) : (
        <MasseSalarialeDashboard bulletins={bulletinsData} periode={periode} />
      )}
    </div>
  );
}
