export const dynamic = 'force-dynamic';
export const metadata = { title: "Cohortes d'embauche — RH Manager CI" };

import { createServerClient } from "@/lib/supabase/server";
import { Users, TrendingDown, Calendar } from "lucide-react";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

interface Employee {
  id: string;
  full_name: string;
  date_embauche: string;
  statut: string | null;
  poste: string;
  date_archivage_prevue: string | null;
  created_at: string | null;
}

interface CohortRow {
  yearLabel: string;
  embauches: number;
  presents: number;
  retentionPct: number;
  ancienneteMois: number;
}

function monthsBetween(start: string, end: Date): number {
  const s = new Date(start);
  return Math.max(0, (end.getFullYear() - s.getFullYear()) * 12 + (end.getMonth() - s.getMonth()));
}

export default async function CohortesPage() {
  const supabase = createServerClient();

  const { data: profile } = await supabase.from("profiles").select("company_id").single();
  if (!profile?.company_id) return null;

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, date_embauche, statut, poste, date_archivage_prevue, created_at")
    .eq("company_id", profile.company_id);

  const list = (employees ?? []) as Employee[];

  // Grouper par année d'embauche
  const byYear: Record<number, Employee[]> = {};
  list.forEach((e) => {
    if (!e.date_embauche) return;
    const y = new Date(e.date_embauche).getFullYear();
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(e);
  });

  const now = new Date();
  const cohortes: CohortRow[] = Object.entries(byYear)
    .map(([year, emps]) => {
      const y = Number(year);
      const embauches = emps.length;
      const presents = emps.filter((e) => e.statut === "actif").length;
      const retentionPct = embauches > 0 ? Math.round((presents / embauches) * 100) : 0;
      const ancienneteMois = Math.round(
        emps.reduce((sum, e) => sum + monthsBetween(e.date_embauche, now), 0) / Math.max(embauches, 1)
      );
      return { yearLabel: String(y), embauches, presents, retentionPct, ancienneteMois };
    })
    .sort((a, b) => b.yearLabel.localeCompare(a.yearLabel));

  const totalEmbauches = cohortes.reduce((s, c) => s + c.embauches, 0);
  const totalPresents = cohortes.reduce((s, c) => s + c.presents, 0);
  const turnoverPct = totalEmbauches > 0
    ? Math.round(((totalEmbauches - totalPresents) / totalEmbauches) * 100)
    : 0;

  // Évolution mensuelle des embauches (12 derniers mois)
  const monthlyHires: Record<string, number> = {};
  const monthlyDepartures: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyHires[key] = 0;
    monthlyDepartures[key] = 0;
  }
  list.forEach((e) => {
    if (e.date_embauche) {
      const d = new Date(e.date_embauche);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyHires) monthlyHires[key]++;
    }
    if (e.statut && e.statut !== "actif" && e.date_archivage_prevue) {
      const d = new Date(e.date_archivage_prevue);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyDepartures) monthlyDepartures[key]++;
    }
  });

  const monthsAxis = Object.keys(monthlyHires).reverse();
  const maxMonthly = Math.max(...Object.values(monthlyHires), ...Object.values(monthlyDepartures), 1);

  return (
    <PageShell>
      <PageHeader
        title="Cohortes d'embauche"
        description="Suivi de rétention par génération de recrutement — taux de présence et ancienneté moyenne."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Total embauches</p>
            <p className="text-2xl font-bold text-slate-800">{totalEmbauches}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Présents</p>
            <p className="text-2xl font-bold text-emerald-700">{totalPresents}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <TrendingDown className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Turnover global</p>
            <p className="text-2xl font-bold text-rose-700">{turnoverPct}%</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Cohortes</p>
            <p className="text-2xl font-bold text-slate-800">{cohortes.length}</p>
          </div>
        </div>
      </div>

      {/* Graphique mensuel : embauches vs départs sur 12 mois */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Flux mensuel — 12 derniers mois</h2>
          <p className="text-xs text-slate-500 mt-0.5">Embauches vs départs par mois</p>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-2 h-44">
            {monthsAxis.map((m) => {
              const hires = monthlyHires[m];
              const departures = monthlyDepartures[m];
              const hiresPct = (hires / maxMonthly) * 100;
              const depPct = (departures / maxMonthly) * 100;
              const [, mn] = m.split("-");
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full h-full flex items-end gap-0.5">
                    <div
                      className="flex-1 bg-emerald-400 rounded-t-md hover:bg-emerald-500 transition-colors relative"
                      style={{ height: `${hiresPct}%`, minHeight: hires > 0 ? "4px" : "0" }}
                      title={`${hires} embauche${hires > 1 ? "s" : ""}`}
                    >
                      {hires > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          +{hires}
                        </span>
                      )}
                    </div>
                    <div
                      className="flex-1 bg-rose-300 rounded-t-md hover:bg-rose-400 transition-colors"
                      style={{ height: `${depPct}%`, minHeight: departures > 0 ? "4px" : "0" }}
                      title={`${departures} départ${departures > 1 ? "s" : ""}`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">{mn}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-50">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="h-2.5 w-2.5 rounded bg-emerald-400" />
              Embauches
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="h-2.5 w-2.5 rounded bg-rose-300" />
              Départs
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des cohortes */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Rétention par année d'embauche</h2>
          <p className="text-xs text-slate-500 mt-0.5">Pourcentage d'employés encore présents</p>
        </div>
        {cohortes.length === 0 ? (
          <div className="p-16 text-center text-sm text-slate-400">
            Aucune donnée d'embauche pour calculer les cohortes.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Année</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Embauches</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Présents</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Ancienneté moyenne</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 w-1/3">Rétention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cohortes.map((c) => {
                const barColor =
                  c.retentionPct >= 80 ? "bg-emerald-500" :
                  c.retentionPct >= 50 ? "bg-amber-500" :
                  c.retentionPct >= 25 ? "bg-orange-500" :
                  "bg-rose-500";
                const ans = Math.floor(c.ancienneteMois / 12);
                const mois = c.ancienneteMois % 12;
                return (
                  <tr key={c.yearLabel} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-800 text-base">{c.yearLabel}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-slate-700">{c.embauches}</td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-emerald-700">{c.presents}</td>
                    <td className="px-5 py-4 text-right text-xs text-slate-500">
                      {ans > 0 ? `${ans} an${ans > 1 ? "s" : ""}` : ""}{ans > 0 && mois > 0 ? " " : ""}{mois > 0 ? `${mois} mois` : ans === 0 ? "0 mois" : ""}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${c.retentionPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-10 text-right">{c.retentionPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
