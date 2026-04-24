import { createServerClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/rh/KpiCard";
import { Badge } from "@/components/ui/badge";
import { ComplianceAuditHeader } from "@/components/rh/ComplianceAuditHeader";
import { ComplianceAlertList } from "@/components/rh/ComplianceAlertList";
import { QuickActions } from "@/components/rh/QuickActions";
import { DashboardCharts } from "@/components/rh/DashboardCharts";
import {
  UsersIcon as Users,
  WarningIcon as FileWarning,
  BriefcaseIcon as Briefcase,
  ScalesIcon as Scale,
} from "@/components/rh/ClientIcons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

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
      .gte("date_fin", today)
      .lte("date_fin", in30Days),
    supabase
      .from("medical_exams")
      .select("*", { count: "exact", head: true })
      .gte("prochaine_visite", today)
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
      .gte("date_fin_essai", today)
      .lte("date_fin_essai", in30Days),
    supabase
      .from("contracts")
      .select("employee_id, date_fin, type_contrat, employees(full_name)")
      .eq("statut", "actif")
      .gte("date_fin", today)
      .lte("date_fin", in30Days)
      .limit(3),
    supabase
      .from("medical_exams")
      .select("employee_id, date_expiration, type_examen, employees(full_name)")
      .gte("date_expiration", today)
      .lte("date_expiration", in30Days)
      .limit(3),
    supabase
      .from("contracts")
      .select("employee_id, date_fin_essai, type_contrat, employees(full_name)")
      .eq("statut", "actif")
      .gte("date_fin_essai", today)
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
    <div className="relative min-h-screen bg-slate-50/40">
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative px-6 py-7 space-y-8 max-w-[1400px]">

        {/* ── HERO ── */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-2">
              {dateLabel}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
              Tableau de bord
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1.5">
              Capital humain — Côte d&apos;Ivoire
            </p>
          </div>

          <ComplianceAuditHeader
            score={Math.round(complianceScore)}
            risks={{
              contracts: cddExpirant ?? 0,
              trials: essaiExpirant ?? 0,
              medical: medicalAlertsCount ?? 0,
              documents: missingDocsTotal,
            }}
          />
        </section>

        {/* ── ACTIONS RAPIDES ── */}
        <section>
          <SectionLabel>Actions rapides</SectionLabel>
          <QuickActions />
        </section>

        {/* ── KPIs — Bento asymétrique ── */}
        <section>
          <SectionLabel>Indicateurs clés</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-2 lg:col-span-2">
              <KpiCard
                label="Effectif actif"
                value={totalActifs || 0}
                icon={Users}
                description="Collaborateurs en poste"
                index={0}
                featured
              />
            </div>
            <KpiCard
              label="Recrutements"
              value={postesOuverts || 0}
              icon={Briefcase}
              variant="success"
              description="Postes ouverts"
              index={1}
            />
            <KpiCard
              label="Contentieux"
              value={contentieuxOuverts ?? 0}
              icon={Scale}
              description="Dossiers actifs"
              variant={(contentieuxOuverts ?? 0) > 0 ? "warning" : "default"}
              index={2}
            />
            <KpiCard
              label="Alertes médicales"
              value={medicalAlertsCount ?? 0}
              icon={FileWarning}
              description="Visites sous 30 jours"
              variant={(medicalAlertsCount ?? 0) > 0 ? "danger" : "default"}
              index={3}
            />
            <KpiCard
              label="Évaluations"
              value={evalBrouillon ?? 0}
              icon={Briefcase}
              description="En brouillon"
              variant={(evalBrouillon ?? 0) > 0 ? "warning" : "default"}
              index={4}
            />
          </div>
        </section>

        {/* ── CHARTS ── */}
        <section>
          <SectionLabel>Analyses</SectionLabel>
          <DashboardCharts deptData={chartDeptData} genderData={chartGenderData} />
        </section>

        {/* ── ALERTES & CONGÉS ── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ComplianceAlertList alerts={allAlerts} />

          <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-none">Congés en attente</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Demandes nécessitant une approbation
                </p>
              </div>
              <Link href="/conges">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 gap-1"
                >
                  Tout voir
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {!congesEnAttente || congesEnAttente.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/40">
                <p className="text-xs text-slate-400 font-medium">Aucune demande en attente.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {congesEnAttente.map((c) => {
                  const empRaw = c.employees;
                  const emp = Array.isArray(empRaw) ? empRaw[0] : empRaw;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[oklch(0.175_0.04_248)] flex items-center justify-center font-bold text-[oklch(0.78_0.13_73)] text-xs shrink-0">
                          {emp?.full_name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 leading-none">
                            {emp?.full_name ?? "—"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">
                            {new Date(c.date_debut as string).toLocaleDateString("fr-CI")} ·{" "}
                            {c.nb_jours} jour{(c.nb_jours ?? 1) > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-slate-50 border-slate-200 text-slate-500 font-semibold text-[9px] uppercase tracking-widest"
                      >
                        {c.type}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── ACTIVITÉ & COLLABORATEURS ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Timeline GED */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-5">Documents récents</h2>
            <div className="space-y-5">
              {recentActivities?.map((act, i) => (
                <div key={act.id} className="flex gap-3 relative">
                  {i < (recentActivities.length - 1) && (
                    <div className="absolute left-[13px] top-7 bottom-0 w-px bg-slate-100" />
                  )}
                  <div className="h-7 w-7 rounded-full border border-slate-100 bg-white flex items-center justify-center shrink-0 z-10">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{act.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {(act.employees as { full_name?: string })?.full_name}
                    </p>
                    <p className="text-[9px] text-slate-300 mt-1 font-mono">
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
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-slate-900">Derniers collaborateurs</h2>
              <Link href="/employes">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[11px] font-semibold border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
                >
                  Voir tout
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Collaborateur
                    </th>
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Poste
                    </th>
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Contrat
                    </th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {derniersEmployes?.map((emp) => (
                    <tr
                      key={emp.id}
                      className="group hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-[oklch(0.175_0.04_248)] flex items-center justify-center font-bold text-[oklch(0.78_0.13_73)] text-xs shrink-0">
                            {emp.full_name?.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800 text-xs">
                            {emp.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <p className="text-xs font-medium text-slate-700">{emp.poste}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">
                          {emp.departement ?? "—"}
                        </p>
                      </td>
                      <td className="py-3.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          {emp.type_contrat ?? "—"}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[9px] font-bold uppercase text-emerald-700 tracking-wide">
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-slate-200/60" />
    </div>
  );
}
