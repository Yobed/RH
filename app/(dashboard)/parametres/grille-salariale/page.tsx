import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Grille salariale catégorielle — RH Manager CI" };
export const dynamic = "force-dynamic";

type Famille = "TEC" | "CHA" | "EMP" | "CAD" | "OUV";

interface SalaryGridRow {
  id: string;
  libelle: string;
  code: string;
  famille: Famille;
  type_remu: string;
  salaire_base: number;
}

const FAMILLE_META: Record<Famille, { label: string; color: string }> = {
  CAD: { label: "Cadres / Ingénieurs", color: "bg-purple-50 text-purple-700 border-purple-200" },
  TEC: { label: "Agents techniques",   color: "bg-blue-50 text-blue-700 border-blue-200" },
  EMP: { label: "Employés",            color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  OUV: { label: "Ouvriers",            color: "bg-amber-50 text-amber-700 border-amber-200" },
  CHA: { label: "Chauffeurs",          color: "bg-rose-50 text-rose-700 border-rose-200" },
};

function formatFCFA(value: number): string {
  return new Intl.NumberFormat("fr-CI", { maximumFractionDigits: 2 }).format(value);
}

export default async function GrilleSalarialePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data, error } = await supabase
    .from("salary_grid")
    .select("id, libelle, code, famille, type_remu, salaire_base")
    .eq("actif", true)
    .order("ordre", { ascending: true });

  const rows = (data ?? []) as SalaryGridRow[];

  const familles = (Object.keys(FAMILLE_META) as Famille[]).map((fam) => ({
    fam,
    meta: FAMILLE_META[fam],
    rows: rows.filter((r) => r.famille === fam),
  }));

  const minSalary = rows.length ? Math.min(...rows.map((r) => r.salaire_base)) : 0;
  const maxSalary = rows.length ? Math.max(...rows.map((r) => r.salaire_base)) : 0;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Grille salariale catégorielle
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Référentiel partagé — Convention Collective Interprofessionnelle Côte d'Ivoire.
            Les salaires de base s'auto-remplissent dans la fiche employé selon la catégorie choisie.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Catégories</p>
            <p className="text-lg font-semibold text-slate-900">{rows.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Min — Max</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatFCFA(minSalary)} → {formatFCFA(maxSalary)}
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Erreur lors du chargement : {error.message}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {familles.map(({ fam, meta, rows: famRows }) => (
          <section
            key={fam}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase ${meta.color}`}>
                  {fam}
                </span>
                <h2 className="text-sm font-semibold text-slate-900">{meta.label}</h2>
              </div>
              <span className="text-xs text-slate-500">{famRows.length} catégories</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Libellé</th>
                  <th className="px-4 py-2 text-left font-medium">Code</th>
                  <th className="px-4 py-2 text-right font-medium">Salaire de base (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {famRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2 text-slate-900">{r.libelle}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">{r.code}</td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-900 tabular-nums">
                      {formatFCFA(r.salaire_base)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <footer className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
        <strong>Note :</strong> Cette grille est en lecture seule pour les utilisateurs.
        Toute modification doit être réalisée par un super-administrateur via la base Supabase
        ou une migration dédiée.
      </footer>
    </div>
  );
}
