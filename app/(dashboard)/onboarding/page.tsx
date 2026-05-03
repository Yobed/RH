import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { progressOf, overdueItems, type OnboardingItem } from "@/lib/onboarding-template";
import { CheckCircle, Clock, Warning, ArrowRight, UserPlus } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding — RH Manager CI" };

const fcategory: Record<string, string> = {
  legal: "Légal",
  admin: "Admin",
  technique: "Technique",
  humain: "Humain",
};

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function OnboardingPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: employees }, { data: checklists }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, poste, departement, date_embauche, statut")
      .eq("statut", "actif")
      .order("date_embauche", { ascending: false })
      .limit(200),
    supabase
      .from("onboarding_checklists")
      .select("employee_id, items, completed_at"),
  ]);

  const empList = employees ?? [];
  const checklistMap = new Map(
    (checklists ?? []).map((c) => [c.employee_id, c])
  );

  const rows = empList.map((emp) => {
    const cl = checklistMap.get(emp.id);
    const items: OnboardingItem[] = cl?.items ?? [];
    const progress = items.length > 0 ? progressOf(items) : { done: 0, total: 0, pct: 0 };
    const overdue = overdueItems(items, emp.date_embauche);
    return { emp, items, progress, overdue, completedAt: cl?.completed_at ?? null };
  });

  const total = rows.length;
  const done = rows.filter((r) => r.completedAt).length;
  const withOverdue = rows.filter((r) => r.overdue.length > 0).length;
  const notStarted = rows.filter((r) => r.items.length === 0).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-indigo-500" weight="duotone" />
            Onboarding collaborateurs
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Suivi des étapes d'intégration — conformité CT-CI
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Collaborateurs actifs", value: total, color: "text-slate-700", bg: "bg-slate-50" },
          { label: "Onboarding terminé", value: done, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Étapes en retard", value: withOverdue, color: "text-red-600", bg: "bg-red-50" },
          { label: "Pas encore démarré", value: notStarted, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border border-slate-200 ${bg} p-4`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-sm font-semibold text-slate-700">Tous les collaborateurs actifs</p>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Aucun collaborateur actif trouvé.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {rows.map(({ emp, progress, overdue, completedAt, items }) => (
              <Link
                key={emp.id}
                href={`/employes/${emp.id}/onboarding`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
              >
                {/* Statut icône */}
                <div className="shrink-0">
                  {completedAt ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" weight="duotone" />
                  ) : overdue.length > 0 ? (
                    <Warning className="h-5 w-5 text-red-400" weight="duotone" />
                  ) : items.length === 0 ? (
                    <Clock className="h-5 w-5 text-slate-300" weight="duotone" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-400" weight="duotone" />
                  )}
                </div>

                {/* Infos employé */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {emp.full_name}
                    </span>
                    {emp.matricule && (
                      <span className="text-xs text-slate-400">{emp.matricule}</span>
                    )}
                    {overdue.length > 0 && (
                      <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                        {overdue.length} en retard
                      </span>
                    )}
                    {completedAt && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                        Terminé
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {emp.poste ?? "—"}{emp.departement ? ` · ${emp.departement}` : ""}
                    {emp.date_embauche ? ` · Embauché le ${new Date(emp.date_embauche).toLocaleDateString("fr-CI")}` : ""}
                  </p>
                </div>

                {/* Progression */}
                <div className="w-32 shrink-0 hidden sm:block">
                  {items.length > 0 ? (
                    <div className="space-y-1">
                      <ProgressBar pct={progress.pct} />
                      <p className="text-xs text-slate-400 text-right">
                        {progress.done}/{progress.total} étapes
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-right">Non démarré</p>
                  )}
                </div>

                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
