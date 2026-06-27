import { createServerClient } from "@/lib/supabase/server";
import { ExecutiveRhCockpit } from "@/components/rh/ExecutiveRhCockpit";
import { type ActionItem } from "@/components/rh/ActionCenter";

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
      .order("created_at", { ascending: false }),
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

  const actionItems: ActionItem[] = [
    { type: "conges", count: congesEnAttente?.length ?? 0 },
    { type: "contentieux", count: contentieuxOuverts ?? 0 },
    { type: "cdd", count: cddExpirant ?? 0 },
    { type: "essai", count: essaiExpirant ?? 0 },
    { type: "medical", count: medicalAlertsCount ?? 0 },
    { type: "evaluation", count: evalBrouillon ?? 0 },
  ];

  return (
    <ExecutiveRhCockpit
      totalActifs={totalActifs ?? 0}
      totalFemmes={totalFemmes ?? 0}
      cddExpirant={cddExpirant ?? 0}
      medicalAlertsCount={medicalAlertsCount ?? 0}
      postesOuverts={postesOuverts ?? 0}
      evalBrouillon={evalBrouillon ?? 0}
      contentieuxOuverts={contentieuxOuverts ?? 0}
      complianceScore={complianceScore}
      dateLabel={dateLabel}
      actionItems={actionItems}
      allAlerts={allAlerts}
      chartDeptData={chartDeptData}
      chartGenderData={chartGenderData}
      congesEnAttente={congesEnAttente ?? []}
      recentActivities={recentActivities ?? []}
      derniersEmployes={derniersEmployes ?? []}
      missingDocsTotal={missingDocsTotal}
      totalExpectedDocs={totalExpectedDocs}
      essaiExpirant={essaiExpirant ?? 0}
    />
  );
}
