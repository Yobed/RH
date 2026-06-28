import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import {
  offboardingProgress,
  offboardingOverdueItems,
  type OffboardingItem,
} from "@/lib/offboarding-template";
import { ArrowRight, UserMinus, Warning, CheckCircle, Plus } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";
export const metadata = { title: "Offboarding — RH Manager CI" };

interface EmployeeRow {
  id: string;
  full_name: string;
  matricule: string;
  poste: string;
  departement: string | null;
  statut: string;
}

interface ChecklistRow {
  employee_id: string;
  items: OffboardingItem[] | null;
  date_sortie_prevue: string | null;
  completed_at: string | null;
  rupture_id: string | null;
}

interface RuptureRow {
  id: string;
  employee_id: string;
  type_rupture: string;
  date_sortie_effective: string | null;
  statut: string;
}

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function OffboardingPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: employees }, { data: checklists }, { data: ruptures }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, poste, departement, statut")
      .order("full_name")
      .limit(500),
    supabase
      .from("offboarding_checklists")
      .select("employee_id, items, date_sortie_prevue, completed_at, rupture_id"),
    supabase
      .from("ruptures")
      .select("id, employee_id, type_rupture, date_sortie_effective, statut")
      .in("statut", ["brouillon", "notifie", "signe"]),
  ]);

  const empList = (employees ?? []) as EmployeeRow[];
  const checklistMap = new Map<string, ChecklistRow>(
    ((checklists ?? []) as ChecklistRow[]).map((c) => [c.employee_id, c])
  );
  const rupturesByEmp = new Map<string, RuptureRow>(
    ((ruptures ?? []) as RuptureRow[]).map((r) => [r.employee_id, r])
  );

  // Lignes d'intérêt : employés ayant soit une checklist soit une rupture en cours
  const candidates = empList.filter(
    (e) => checklistMap.has(e.id) || rupturesByEmp.has(e.id) || e.statut !== "actif"
  );

  const rows = candidates.map((emp) => {
    const cl = checklistMap.get(emp.id);
    const rupture = rupturesByEmp.get(emp.id);
    const items: OffboardingItem[] = cl?.items ?? [];
    const progress = items.length > 0 ? offboardingProgress(items) : { done: 0, total: 0, pct: 0 };
    const overdue = offboardingOverdueItems(items, cl?.date_sortie_prevue);
    return {
      emp,
      items,
      progress,
      overdue,
      completedAt: cl?.completed_at ?? null,
      dateSortie: cl?.date_sortie_prevue ?? rupture?.date_sortie_effective ?? null,
      rupture,
      hasChecklist: !!cl,
    };
  });

  const total = rows.length;
  const done = rows.filter((r) => r.completedAt).length;
  const withOverdue = rows.filter((r) => r.overdue.length > 0).length;
  const notStarted = rows.filter((r) => !r.hasChecklist).length;

  return (
    <PageShell>
      <PageHeader
        title="Offboarding collaborateurs"
        description="Restitution des biens, accès, formalités de sortie — Art. 16-11 CT-CI"
        help="Le parcours de départ d'un salarié : restitution des biens et accès, formalités de sortie et solde de tout compte (STC). Cadré par le Code du Travail ivoirien (art. 16-11)."
        actions={
          <Link
            href="/paie/fin-de-contrat"
            className="rounded-lg bg-slate-900 text-white px-3.5 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
          >
            Préparer un Solde de Tout Compte
            <ArrowRight className="h-3.5 w-3.5" weight="bold" />
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Sorties en cours" value={total} color="text-slate-900" />
        <Stat label="Clôturées" value={done} color="text-emerald-600" icon={<CheckCircle className="h-4 w-4" weight="fill" />} />
        <Stat label="Items en retard" value={withOverdue} color="text-rose-600" icon={<Warning className="h-4 w-4" weight="fill" />} />
        <Stat label="Sans checklist" value={notStarted} color="text-amber-600" />
      </div>

      {/* Liste */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <UserMinus className="h-10 w-10 text-slate-300 mx-auto mb-3" weight="duotone" />
          <p className="text-sm font-semibold text-slate-600">Aucun offboarding en cours</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Une checklist est créée automatiquement quand un employé passe en statut inactif ou
            qu'une rupture est enregistrée.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Employé</th>
                <th className="px-4 py-2.5 text-left font-medium">Motif</th>
                <th className="px-4 py-2.5 text-left font-medium">Sortie</th>
                <th className="px-4 py-2.5 text-left font-medium w-[200px]">Progression</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const nextItem = !r.completedAt && r.hasChecklist ? r.items.find((i) => !i.done) : undefined;
                return (
                <tr key={r.emp.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{r.emp.full_name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {r.emp.matricule} · {r.emp.poste}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.rupture ? (
                      <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-semibold uppercase">
                        {r.rupture.type_rupture.replace(/_/g, " ")}
                      </span>
                    ) : r.emp.statut !== "actif" ? (
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold uppercase">
                        {r.emp.statut}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {r.dateSortie ? (
                      new Date(r.dateSortie).toLocaleDateString("fr-CI", {
                        day: "numeric", month: "short", year: "numeric",
                      })
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.hasChecklist ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono tabular-nums text-slate-700">
                            {r.progress.done}/{r.progress.total}
                          </span>
                          {r.overdue.length > 0 && (
                            <span className="text-rose-600 font-medium flex items-center gap-1">
                              <Warning className="h-3 w-3" weight="fill" />
                              {r.overdue.length} en retard
                            </span>
                          )}
                        </div>
                        <ProgressBar pct={r.progress.pct} />
                        {nextItem && (
                          <p className="mt-1 truncate text-[11px] font-medium text-teal-600 dark:text-teal-400">
                            → {nextItem.title}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">Non créée</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/offboarding/${r.emp.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                    >
                      {r.hasChecklist ? "Gérer" : "Créer"}
                      {r.hasChecklist ? <ArrowRight className="h-3 w-3" weight="bold" /> : <Plus className="h-3 w-3" weight="bold" />}
                    </Link>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

function Stat({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
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
