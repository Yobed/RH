import { createServerClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/rh/KpiCard";
import { Badge } from "@/components/ui/badge";
import { ComplianceAuditHeader } from "@/components/rh/ComplianceAuditHeader";
import { ComplianceAlertList } from "@/components/rh/ComplianceAlertList";
import { QuickActions } from "@/components/rh/QuickActions";
import { DashboardCharts } from "@/components/rh/DashboardCharts";
import {
  Users,
  FileWarning,
  Briefcase,
  BarChart2,
  Scale,
  TrendingUp,
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    { data: recentActivities }
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
    supabase
      .from("employees")
      .select("departement")
      .eq("statut", "actif"),
    supabase
      .from("conges")
      .select("id, employees(full_name), type, nb_jours, date_debut, date_fin")
      .eq("statut", "demande")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("documents")
      .select("employee_id, type"),
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
      .limit(5)
  ]);

  // Préparer les alertes pour ComplianceAlertList
  const allAlerts: any[] = [
    ...(contractsDet?.map(c => ({
      id: c.employee_id,
      type: "CONTRACT",
      label: `Fin de ${c.type_contrat}`,
      employeeName: (c.employees as any)?.full_name || "Employé",
      date: c.date_fin,
      urgency: "high"
    })) || []),
    ...(trialsDet?.map(t => ({
      id: t.employee_id,
      type: "TRIAL",
      label: "Fin de période d'essai",
      employeeName: (t.employees as any)?.full_name || "Employé",
      date: t.date_fin_essai,
      urgency: "high"
    })) || []),
    ...(medicalDet?.map(m => ({
      id: m.employee_id,
      type: "MEDICAL",
      label: `Visite ${m.type_examen}`,
      employeeName: (m.employees as any)?.full_name || "Employé",
      date: m.date_expiration,
      urgency: "medium"
    })) || [])
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

  // Calcul approfondi de la conformité documentaire
  const mandatoryDocsPerEmployee = 3;
  const totalExpectedDocs = (totalActifs ?? 0) * mandatoryDocsPerEmployee;
  
  const docTracking: Record<string, Set<string>> = {};
  documentCounts?.forEach(doc => {
    if (!docTracking[doc.employee_id]) docTracking[doc.employee_id] = new Set();
    const type = doc.type?.toUpperCase();
    if (type?.includes("CNI") || type?.includes("PASSEPORT")) docTracking[doc.employee_id].add("IDENTITY");
    if (type?.includes("CONTRAT")) docTracking[doc.employee_id].add("CONTRACT");
    if (type?.includes("CV")) docTracking[doc.employee_id].add("CV");
  });

  const actualDocsCount = Object.values(docTracking).reduce((acc, current) => acc + current.size, 0);
  const missingDocsTotal = Math.max(0, totalExpectedDocs - actualDocsCount);

  const complianceScore = Math.max(0, 100 - (
    ((cddExpirant ?? 0) * 8) + 
    ((essaiExpirant ?? 0) * 10) + 
    ((medicalAlertsCount ?? 0) * 5) + 
    (Math.min(missingDocsTotal, 50) * 1)
  ));

  const pctFemmes =
    totalActifs && totalActifs > 0
      ? Math.round(((totalFemmes ?? 0) / totalActifs) * 100)
      : 0;

  // Données pour les charts
  const deptMap: Record<string, number> = {};
  parDepartement?.forEach((e) => {
    const dept = e.departement ?? "Non défini";
    deptMap[dept] = (deptMap[dept] ?? 0) + 1;
  });
  const chartDeptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));
  
  const chartGenderData = [
    { name: "Hommes", value: (totalActifs ?? 0) - (totalFemmes ?? 0) },
    { name: "Femmes", value: totalFemmes ?? 0 }
  ];

  return (
    <div className="p-6 space-y-10 bg-slate-50/30 min-h-screen">
      {/* SECTION: HERO & COMPLIANCE */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Tableau de Bord <span className="text-primary italic">RH</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Gestion centralisée de votre capital humain en Côte d'Ivoire.
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border shadow-sm flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">Aujourd'hui</p>
              <p className="text-sm font-bold text-slate-700 mt-1">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <ComplianceAuditHeader 
          score={Math.round(complianceScore)}
          risks={{
            contracts: cddExpirant ?? 0,
            trials: essaiExpirant ?? 0,
            medical: medicalAlertsCount ?? 0,
            documents: missingDocsTotal
          }}
        />
      </section>

      {/* SECTION: QUICK ACTIONS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Actions Rapides</h2>
        </div>
        <QuickActions />
      </section>

      {/* SECTION: KPI CORES */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Effectif actif"
          value={totalActifs ?? 0}
          icon={Users}
          description="Total collaborateurs (Statut Actif)"
        />
        <KpiCard
          label="Parité Homme/Femme"
          value={`${pctFemmes} %`}
          icon={TrendingUp}
          description={`${totalFemmes ?? 0} femmes sur ${totalActifs ?? 0}`}
          variant="success"
        />
        <KpiCard
          label="Alertes Fin de CDD"
          value={cddExpirant ?? 0}
          icon={FileWarning}
          description="Contrats expirant sous 30 jours"
          variant={(cddExpirant ?? 0) > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Postes de Recrutement"
          value={postesOuverts ?? 0}
          icon={Briefcase}
          description="Offres actuellement au statut 'Ouvert'"
        />
        <KpiCard
          label="Évaluations en cours"
          value={evalBrouillon ?? 0}
          icon={BarChart2}
          description="Performance à finaliser"
          variant={(evalBrouillon ?? 0) > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Cas de Contentieux"
          value={contentieuxOuverts ?? 0}
          icon={Scale}
          description="Dossiers juridiques actifs"
          variant={(contentieuxOuverts ?? 0) > 0 ? "danger" : "default"}
        />
      </section>

      {/* SECTION: CHARTS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Analyses Visuelles</h2>
        </div>
        <DashboardCharts deptData={chartDeptData} genderData={chartGenderData} />
      </section>

      {/* SECTION: ALERTS & DEMANDES */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ComplianceAlertList alerts={allAlerts} />
        
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-none">Congés en attente</h2>
              <p className="text-xs text-muted-foreground mt-2">Demandes nécessitant une approbation</p>
            </div>
            <Link href="/conges">
              <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5">
                Tout voir <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {!congesEnAttente || congesEnAttente.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-400 font-medium italic">Aucune demande en attente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {congesEnAttente.map((c) => {
                const empRaw = c.employees;
                const emp = Array.isArray(empRaw) ? empRaw[0] : empRaw;
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/30 px-4 py-3 hover:border-primary/20 hover:bg-white transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        {emp?.full_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{emp?.full_name ?? "—"}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {new Date(c.date_debut as string).toLocaleDateString("fr-CI")} ({c.nb_jours} jours)
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white border-slate-200 font-bold uppercase text-[10px] tracking-widest">{c.type}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION: ACTIVITY & LAST ADDED */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activités Récentes (Documents) */}
        <div className="lg:col-span-1 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">GED Récents</h2>
          <div className="space-y-6">
            {recentActivities?.map((act) => (
              <div key={act.id} className="flex gap-4 relative pb-6 last:pb-0">
                {/* Timeline Line */}
                <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-100 last:hidden" />
                
                <div className="h-8 w-8 rounded-full border bg-white flex items-center justify-center shrink-0 z-10">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{act.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Généré pour <span className="text-slate-600 font-bold">{(act.employees as any)?.full_name}</span>
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-black">
                    {new Date(act.created_at).toLocaleDateString('fr-CI', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Derniers collaborateurs */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Derniers Collaborateurs</h2>
            <Link href="/employes">
              <Button variant="outline" size="sm" className="font-bold border-slate-200">Voir tout</Button>
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-y border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-widest">Collaborateur</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-widest">Poste / Dépt</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-[10px] tracking-widest">Contrat</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase text-[10px] tracking-widest">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {derniersEmployes?.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                          {emp.full_name?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800 group-hover:text-primary transition-colors">{emp.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-700">{emp.poste}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{emp.departement ?? "—"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-tighter">
                        {emp.type_contrat || "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold uppercase">{emp.statut}</span>
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
  );
}
