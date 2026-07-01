import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import {
  projectionsRetraite,
  URGENCE_META,
  AGE_LEGAL_RETRAITE,
  type RetraiteUrgence,
} from "@/lib/retraite-ci";
import { CalendarBlank, UserMinus, Warning, Cake, UserPlus, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { PageShell, PageHeader, StatCard } from "@/components/ui/page-shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planning retraite — RH Manager CI" };

interface SearchProps {
  searchParams: Promise<{ horizon?: string }>;
}

export default async function PlanningRetraitePage({ searchParams }: SearchProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const horizonAnnees = Number(params.horizon ?? "5");
  const horizon = [1, 2, 5, 10].includes(horizonAnnees) ? horizonAnnees : 5;

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, matricule, poste, departement, date_naissance, statut")
    .eq("statut", "actif");

  const projections = projectionsRetraite(employees ?? [], horizon);

  // KPIs
  const imminentes = projections.filter((p) => p.urgence === "imminente").length;
  const proches    = projections.filter((p) => p.urgence === "proche").length;
  const moyennes   = projections.filter((p) => p.urgence === "moyen").length;

  // Groupement par année calendaire pour la projection
  const byYear = new Map<number, typeof projections>();
  for (const p of projections) {
    const year = new Date(p.date_retraite).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(p);
  }
  const years = Array.from(byYear.keys()).sort();

  return (
    <PageShell>
      <PageHeader
        title="Planning retraite & remplacement"
        description={
          <>
            Projection des départs à la retraite à <strong>{AGE_LEGAL_RETRAITE} ans</strong> (Art. 28 CNPS CI)
            · Plan de recrutement de remplacement
          </>
        }
        actions={
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-1.5">Horizon :</span>
            {[1, 2, 5, 10].map((h) => (
              <Link
                key={h}
                href={`/analytique/retraite?horizon=${h}`}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  horizon === h
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {h} an{h > 1 ? "s" : ""}
              </Link>
            ))}
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total projetés" value={projections.length} icon={<UserMinus className="h-4 w-4" />} />
        <StatCard label="< 1 an" value={imminentes} icon={<Warning weight="fill" className="h-4 w-4" />} tone="danger" />
        <StatCard label="1 – 2 ans" value={proches} icon={<CalendarBlank className="h-4 w-4" />} tone="warning" />
        <StatCard label="2 – 5 ans" value={moyennes} icon={<CalendarBlank className="h-4 w-4" />} tone="brand" />
      </div>

      {/* Liste */}
      {projections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Cake className="h-10 w-10 text-slate-300 mx-auto mb-3" weight="duotone" />
          <p className="text-sm font-semibold text-slate-600">
            Aucun départ à la retraite prévu dans les {horizon} prochaines année{horizon > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Renseigne <code>date_naissance</code> sur les fiches employé pour voir la projection.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {years.map((year) => {
            const yearProjections = byYear.get(year)!;
            return (
              <section key={year} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <header className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarBlank className="h-4 w-4 text-slate-500" />
                    {year}
                  </h2>
                  <span className="text-xs text-slate-500">
                    {yearProjections.length} départ{yearProjections.length > 1 ? "s" : ""} à pourvoir
                  </span>
                </header>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500 bg-slate-50/60 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Nom & Prénoms</th>
                      <th className="px-4 py-2 text-left font-medium">Poste à remplacer</th>
                      <th className="px-4 py-2 text-left font-medium">Date 60 ans</th>
                      <th className="px-4 py-2 text-left font-medium">Échéance</th>
                      <th className="px-4 py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {yearProjections.map((p) => {
                      const u = URGENCE_META[p.urgence];
                      return (
                        <tr key={p.employee_id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{p.full_name}</div>
                            <div className="text-xs text-slate-500 font-mono">
                              {p.matricule ?? "—"} · {p.age_actuel} ans
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <div className="text-slate-900 font-medium">{p.poste ?? "—"}</div>
                            <div className="text-slate-500">{p.departement ?? ""}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700">
                            {new Date(p.date_retraite).toLocaleDateString("fr-CI", {
                              day: "numeric", month: "long", year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className={`inline-flex items-center rounded-full ${u.bg} ${u.color} ${u.border} border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}>
                              {p.jours_avant_retraite >= 0
                                ? `${p.mois_avant_retraite > 0 ? p.mois_avant_retraite : 0} mois`
                                : "Dépassé"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/recrutement?poste=${encodeURIComponent(p.poste ?? "")}&from_retraite=${p.employee_id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                            >
                              <UserPlus className="h-3 w-3" weight="bold" />
                              Recruter
                              <ArrowRight className="h-3 w-3" weight="bold" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      )}

      {/* Plan de recrutement de remplacement */}
      {projections.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-amber-50/30 p-5">
          <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-2">
            <UserPlus className="h-4 w-4" />
            Plan de recrutement de remplacement
          </h2>
          <p className="text-xs text-amber-900/80 mb-3">
            Anticiper le recrutement <strong>au moins 6 mois</strong> avant la date de retraite pour
            assurer la passation. Postes à pourvoir (regroupés) :
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {groupByPoste(projections).map(([poste, count]) => (
              <Link
                key={poste}
                href={`/recrutement?poste=${encodeURIComponent(poste)}`}
                className="rounded-lg border border-amber-200 bg-white px-3 py-2 hover:border-amber-400 hover:bg-amber-50 transition-colors"
              >
                <div className="text-sm font-semibold text-slate-900 truncate">{poste}</div>
                <div className="text-xs text-amber-700 mt-0.5">{count} poste{count > 1 ? "s" : ""} à pourvoir</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}

function groupByPoste(
  projections: { poste: string | null }[]
): Array<[string, number]> {
  const map = new Map<string, number>();
  for (const p of projections) {
    const key = p.poste ?? "Non défini";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function Stat({
  label,
  value,
  icon,
  color = "text-slate-900",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className={`flex items-center gap-1.5 text-2xl font-bold tabular-nums ${color}`}>
        {icon}
        {value}
      </div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5">
        {label}
      </p>
    </div>
  );
}
