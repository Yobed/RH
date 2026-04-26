export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { CompanySocialAnalysis } from "@/components/rh/CompanySocialAnalysis";

export const metadata = { title: "Analyses Sociales — RH Manager CI" };

export default async function AnalysesSocPage() {
  const supabase = createServerClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, departement, salaire_brut, sursalaire, prime_transport, prime_fonction")
    .eq("statut", "actif");

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analyses Sociales & Finance RH</h1>
          <p className="text-sm text-slate-600 mt-0.5 font-medium">Visualisez et maîtrisez votre masse salariale en temps réel</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest border border-emerald-200 text-emerald-700 bg-emerald-50">
            Conformité CI 2025
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest border border-slate-200 text-slate-600 bg-white">
            Live
          </span>
        </div>
      </div>

      {!employees || employees.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm font-medium text-slate-600">Aucune donnée disponible</p>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            Ajoutez des employés avec leurs salaires pour générer les analyses sociales.
          </p>
        </div>
      ) : (
        <CompanySocialAnalysis employees={employees} />
      )}

      <div className="rounded-xl bg-slate-50 border border-slate-100 p-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-4">Lexique des indicateurs</p>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              term: "Masse Salariale (Brut)",
              def: "Somme des salaires de base, sursalaires et primes soumises (ancienneté, fonction) avant toute retenue sociale.",
            },
            {
              term: "Charges Patronales",
              def: "Cotisations payées par l'entreprise à la CNPS (Prestations familiales, Retraite, AT/MP), au FDFP et pour la CMU.",
            },
            {
              term: "Coût Total (TCO)",
              def: "Le coût réel « sorti de caisse » pour l'entreprise. Somme du Salaire Brut et des Charges Patronales.",
            },
          ].map(({ term, def }) => (
            <div key={term} className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">{term}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{def}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
