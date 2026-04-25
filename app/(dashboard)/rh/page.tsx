import { createServerClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/rh/KpiCard";
import { ComplianceAlertList } from "@/components/rh/ComplianceAlertList";
import { QuickActions } from "@/components/rh/QuickActions";
import { DashboardCharts } from "@/components/rh/DashboardCharts";
import { DashboardHeroClient } from "@/components/rh/DashboardHeroClient";
import {
  UsersIcon as Users,
  WarningIcon as FileWarning,
  BriefcaseIcon as Briefcase,
  ScalesIcon as Scale,
  ArrowRightIcon as ArrowRight,
} from "@/components/rh/ClientIcons";
import Link from "next/link";

export const metadata = { title: "Tableau de bord — RH Manager CI" };

export default async function RhPage() {
  const supabase = createServerClient();

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [
    { count: totalActifs },
    { count: totalFemmes },
    { count: cddExpirant },
    { count: medicalAlertsCount },
    { count: postesOuverts },
    { count: evalBrouillon },
    { count: contentieuxOuverts },
    { data: derniersEmployes },
    { data: parDepartement },
    { data: congesEnAttente },
    { data: documentCounts },
    { count: essaiExpirant },
    { data: contractsDet },
    { data: medicalDet },
    { data: trialsDet },
    { data: recentActivities },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("statut", "actif"),
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("statut", "actif")
      .eq("genre", "F"),
    supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("statut", "actif")
      .lte("date_fin", in30Days),
    supabase
      .from("medical_exams")
      .select("*", { count: "exact", head: true })
      .lte("prochaine_visite", in30Days),
    supabase
      .from("job_postings")
      .select("*", { count: "exact", head: true })
      .eq("statut", "ouvert"),
    supabase
      .from("evaluations")
      .select("*", { count: "exact", head: true })
      .eq("statut", "brouillon"),
    supabase
      .from("legal_cases")
      .select("*", { count: "exact", head: true })
      .eq("statut", "ouvert"),
    supabase
      .from("employees")
      .select("id, full_name, poste, departement, date_embauche, statut, type_contrat")
      .eq("statut", "actif")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("employees").select("departement").eq("statut", "actif"),
    supabase
      .from("conges")
      .select("id, employees(full_name), type, nb_jours, date_debut, date_fin")
      .eq("statut", "demande")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("documents").select("employee_id, type"),
    supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("statut", "actif")
      .lte("date_fin_essai", in30Days),
    supabase
      .from("contracts")
      .select("employee_id, date_fin, type_contrat, employees(full_name)")
      .eq("statut", "actif")
      .lte("date_fin", in30Days)
      .limit(3),
    supabase
      .from("medical_exams")
      .select("employee_id, date_expiration, type_examen, employees(full_name)")
      .lte("date_expiration", in30Days)
      .limit(3),
    supabase
      .from("contracts")
      .select("employee_id, date_fin_essai, type_contrat, employees(full_name)")
      .eq("statut", "actif")
      .lte("date_fin_essai", in30Days)
      .limit(3),
    supabase
      .from("documents")
      .select("id, name, created_at, employees(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const allAlerts: {
    id: string;
    type: "CONTRACT" | "TRIAL" | "MEDICAL" | "DOCUMENT";
    label: string;
    employeeName: string;
    date: string;
    urgency: "high" | "medium" | "low";
  }[] = [
    ...(contractsDet?.map((c) => ({
      id: c.employee_id,
      type: "CONTRACT" as const,
      label: `Fin de ${c.type_contrat}`,
      employeeName: (c.employees as { full_name?: string })?.full_name ?? "Employé",
      date: c.date_fin,
      urgency: "high" as const,
    })) ?? []),
    ...(trialsDet?.map((t) => ({
      id: t.employee_id,
      type: "TRIAL" as const,
      label: "Fin de période d'essai",
      employeeName: (t.employees as { full_name?: string })?.full_name ?? "Employé",
      date: t.date_fin_essai,
      urgency: "high" as const,
    })) ?? []),
    ...(medicalDet?.map((m) => ({
      id: m.employee_id,
      type: "MEDICAL" as const,
      label: `Visite ${m.type_examen}`,
      employeeName: (m.employees as { full_name?: string })?.full_name ?? "Employé",
      date: m.date_expiration,
      urgency: "medium" as const,
    })) ?? []),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const mandatoryDocsPerEmployee = 3;
  const totalExpectedDocs = (totalActifs ?? 0) * mandatoryDocsPerEmployee;

  const docTracking: Record<string, Set<string>> = {};
  documentCounts?.forEach((doc) => {
    if (!docTracking[doc.employee_id]) docTracking[doc.employee_id] = new Set();
    const type = doc.type?.toUpperCase();
    if (type?.includes("CNI") || type?.includes("PASSEPORT"))
      docTracking[doc.employee_id].add("IDENTITY");
    if (type?.includes("CONTRAT")) docTracking[doc.employee_id].add("CONTRACT");
    if (type?.includes("CV")) docTracking[doc.employee_id].add("CV");
  });

  const actualDocsCount = Object.values(docTracking).reduce(
    (acc, current) => acc + current.size,
    0
  );
  const missingDocsTotal = Math.max(0, totalExpectedDocs - actualDocsCount);

  const complianceScore = Math.max(
    0,
    100 -
      ((cddExpirant ?? 0) * 8 +
        (essaiExpirant ?? 0) * 10 +
        (medicalAlertsCount ?? 0) * 5 +
        Math.min(missingDocsTotal, 50) * 1)
  );

  const deptMap: Record<string, number> = {};
  parDepartement?.forEach((e) => {
    const dept = e.departement ?? "Non défini";
    deptMap[dept] = (deptMap[dept] ?? 0) + 1;
  });
  const chartDeptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));
  const chartGenderData = [
    { name: "Hommes", value: (totalActifs ?? 0) - (totalFemmes ?? 0) },
    { name: "Femmes", value: totalFemmes ?? 0 },
  ];

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="relative px-4 sm:px-6 py-8 space-y-10 max-w-[1440px]">

        {/* ── HERO ANIMÉ ── */}
        <DashboardHeroClient
          totalActifs={totalActifs ?? 0}
          complianceScore={Math.round(complianceScore)}
          congesEnAttente={congesEnAttente?.length ?? 0}
          dateLabel={dateLabel}
        />

        {/* ── ACTIONS RAPIDES ── */}
        <section className="space-y-3">
          <SectionDivider label="Actions rapides" />
          <QuickActions />
        </section>

        {/* ── BENTO KPIs — 12-col dense grid ── */}
        <section className="space-y-3">
          <SectionDivider label="Indicateurs" />
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 auto-rows-auto" style={{ gridAutoFlow: "dense" }}>
            {/* Featured — col 1-6 */}
            <div className="col-span-2 lg:col-span-6">
              <KpiCard
                label="Effectif actif"
                value={totalActifs || 0}
                icon={Users}
                description="Collaborateurs en poste"
                index={0}
                featured
              />
            </div>
            {/* col 7-9 */}
            <div className="col-span-1 lg:col-span-3">
              <KpiCard
                label="Recrutements"
                value={postesOuverts || 0}
                icon={Briefcase}
                variant="success"
                description="Postes ouverts"
                index={1}
              />
            </div>
            {/* col 10-12 */}
            <div className="col-span-1 lg:col-span-3">
              <KpiCard
                label="Contentieux"
                value={contentieuxOuverts ?? 0}
                icon={Scale}
                description="Dossiers actifs"
                variant={(contentieuxOuverts ?? 0) > 0 ? "warning" : "default"}
                index={2}
              />
            </div>
            {/* col 1-4 */}
            <div className="col-span-1 lg:col-span-4">
              <KpiCard
                label="Alertes médicales"
                value={medicalAlertsCount ?? 0}
                icon={FileWarning}
                description="Visites sous 30 jours"
                variant={(medicalAlertsCount ?? 0) > 0 ? "danger" : "default"}
                index={3}
              />
            </div>
            {/* col 5-8 */}
            <div className="col-span-1 lg:col-span-4">
              <KpiCard
                label="Évaluations"
                value={evalBrouillon ?? 0}
                icon={Briefcase}
                description="En brouillon"
                variant={(evalBrouillon ?? 0) > 0 ? "warning" : "default"}
                index={4}
              />
            </div>
            {/* col 9-12 */}
            <div className="col-span-2 lg:col-span-4">
              <KpiCard
                label="CDD expirant"
                value={cddExpirant ?? 0}
                icon={Briefcase}
                description="Sous 30 jours"
                variant={(cddExpirant ?? 0) > 0 ? "danger" : "default"}
                index={5}
              />
            </div>
          </div>
        </section>

        {/* ── CHARTS ── */}
        <section className="space-y-3">
          <SectionDivider label="Analyses" />
          <DashboardCharts deptData={chartDeptData} genderData={chartGenderData} />
        </section>

        {/* ── ALERTES & CONGÉS ── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ComplianceAlertList alerts={allAlerts} />

          <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-[oklch(0.155_0.030_248)] shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] p-6 flex flex-col glow-hover">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className="text-base font-bold text-slate-900 dark:text-white leading-none"
                  style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
                >
                  Congés en attente
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-600 font-medium mt-1">
                  Demandes à approuver
                </p>
              </div>
              <Link
                href="/conges"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Tout voir <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {!congesEnAttente || congesEnAttente.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-600 font-medium">Aucune demande en attente.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {congesEnAttente.map((c) => {
                  const empRaw = c.employees;
                  const emp = Array.isArray(empRaw) ? empRaw[0] : empRaw;
                  return (
                    <div key={c.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: "oklch(0.175 0.045 248)", color: "oklch(0.78 0.13 73)" }}
                        >
                          {emp?.full_name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">
                            {emp?.full_name ?? "—"}
                          </p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-600 font-medium mt-1">
                            {new Date(c.date_debut as string).toLocaleDateString("fr-CI")} ·{" "}
                            {c.nb_jours} jour{(c.nb_jours ?? 1) > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-600">
                        {c.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── ACTIVITÉ & COLLABORATEURS ── */}
        <div className="grid gap-4 lg:grid-cols-3 pb-8">
          {/* Timeline documents */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-[oklch(0.155_0.030_248)] shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] p-6 glow-hover">
            <h2
              className="text-base font-bold text-slate-900 dark:text-white mb-5"
              style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
            >
              Documents récents
            </h2>
            <div className="space-y-5">
              {recentActivities?.map((act, i) => (
                <div key={act.id} className="flex gap-3 relative">
                  {i < (recentActivities.length - 1) && (
                    <div className="absolute left-[13px] top-7 bottom-0 w-px bg-slate-100 dark:bg-slate-700" />
                  )}
                  <div className="h-7 w-7 rounded-full border border-slate-100 dark:border-slate-600 bg-white dark:bg-[oklch(0.20_0.032_248)] flex items-center justify-center shrink-0 z-10">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{act.name}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-600 mt-0.5">
                      {(act.employees as { full_name?: string })?.full_name}
                    </p>
                    <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-1 font-mono">
                      {new Date(act.created_at).toLocaleDateString("fr-CI", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table collaborateurs */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-[oklch(0.155_0.030_248)] shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] p-6 overflow-hidden glow-hover">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-base font-bold text-slate-900 dark:text-white"
                style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
              >
                Collaborateurs récents
              </h2>
              <Link
                href="/employes"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Voir tout <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-600">
                      Collaborateur
                    </th>
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-600 hidden sm:table-cell">
                      Poste
                    </th>
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-600 hidden sm:table-cell">
                      Contrat
                    </th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-600">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
                  {derniersEmployes?.map((emp) => (
                    <tr key={emp.id} className="group hover:bg-slate-50/60 dark:hover:bg-[oklch(0.18_0.028_248)] transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                            style={{ background: "oklch(0.175 0.045 248)", color: "oklch(0.78 0.13 73)" }}
                          >
                            {emp.full_name?.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{emp.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 hidden sm:table-cell">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{emp.poste}</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-600 font-medium uppercase tracking-wide mt-0.5">
                          {emp.departement ?? "—"}
                        </p>
                      </td>
                      <td className="py-3.5 hidden sm:table-cell">
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-600 px-2 py-0.5 rounded-md">
                          {emp.type_contrat ?? "—"}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wide">
                            {emp.statut}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1 w-1 rounded-full bg-[oklch(0.78_0.13_73)]" />
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-600 whitespace-nowrap">
        {label}
      </p>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
    </div>
  );
}
