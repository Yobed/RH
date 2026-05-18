/**
 * POST /api/notifications/sync
 * Génère automatiquement les notifications pour :
 * - Contrats CDD expirant dans 30j, 15j, 7j, 1j
 * - Évaluations en brouillon depuis + de 7j
 * Peut être appelé par n8n (cron quotidien) ou manuellement.
 */
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Vérification du secret n8n pour les appels automatiques
  const secret = req.headers.get("x-webhook-secret");
  const isWebhook = secret === process.env.N8N_WEBHOOK_SECRET;

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isWebhook) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Récupérer company_id
  let companyId: string;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });
    companyId = profile.company_id;
  } else {
    // Pour appel webhook n8n, on traite toutes les entreprises
    const { data: companies } = await supabase.from("companies").select("id");
    const ids = companies?.map((c) => c.id) ?? [];
    let totalCreated = 0;
    for (const id of ids) {
      const count = await syncForCompany(supabase, id);
      totalCreated += count;
    }
    return NextResponse.json({ created: totalCreated, companies: ids.length });
  }

  const created = await syncForCompany(supabase, companyId);
  return NextResponse.json({ created });
}

function formatDateLocal(dateStr: string): string {
  if (!dateStr) return "N/A";
  const [y, m, d] = dateStr.split("-");
  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)).toLocaleDateString("fr-CI");
}

async function syncForCompany(
  supabase: ReturnType<typeof createServerClient>,
  companyId: string
): Promise<number> {
  const today = new Date();
  let created = 0;

  // 1. Contrats expirant dans 1j, 7j, 15j, 30j
  const alerts = [1, 7, 15, 30];
  for (const jours of alerts) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + jours);
    const dateStr = targetDate.toISOString().split("T")[0];

    const { data: contracts } = await supabase
      .from("contracts")
      .select("id, type_contrat, renouvellement_count, employees!inner(full_name, poste, manager_id)")
      .eq("company_id", companyId)
      .eq("statut", "actif")
      .eq("date_fin", dateStr);

    // Récupérer les noms des N+1 en une seule requête
    const allMgrIds = contracts
      ?.flatMap((c) => Array.isArray(c.employees) ? c.employees : [c.employees])
      .map((emp) => emp?.manager_id)
      .filter((id): id is string => !!id) ?? [];
    const managerIds = Array.from(new Set(allMgrIds));
    const managerNames: Record<string, string> = {};
    if (managerIds.length > 0) {
      const { data: managers } = await supabase
        .from("employees")
        .select("id, full_name")
        .in("id", managerIds);
      managers?.forEach((m) => { managerNames[m.id] = m.full_name; });
    }

    for (const c of contracts ?? []) {
      const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
      const managerNom = emp?.manager_id ? managerNames[emp.manager_id] : null;

      // Éviter les doublons via le titre unique
      const titre = `Contrat J-${jours} : ${emp?.full_name ?? "Employé"}`;
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("company_id", companyId)
        .eq("titre", titre)
        .limit(1)
        .single();

      if (existing) continue;

      const isMaxRenouv = (c.renouvellement_count ?? 0) >= 2;
      let msg = isMaxRenouv
        ? `Le contrat ${c.type_contrat} de ${emp?.full_name} (${emp?.poste}) expire dans ${jours} jour(s). ATTENTION : 2 renouvellements atteints → conversion CDI obligatoire (Art. 15 CT-CI 2025).`
        : `Le contrat ${c.type_contrat} de ${emp?.full_name} (${emp?.poste}) expire dans ${jours} jour(s).`;

      if (managerNom) {
        msg += ` · N+1 à informer : ${managerNom}.`;
      }

      await supabase.from("notifications").insert({
        company_id: companyId,
        type: "alerte_contrat",
        titre,
        message: msg,
      });
      created++;
    }
  }

  // 2. Évaluations brouillon depuis + de 7 jours
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const { data: evalsBrouillon } = await supabase
    .from("evaluations")
    .select("id, periode, employees(full_name)")
    .eq("company_id", companyId)
    .eq("statut", "brouillon")
    .lte("created_at", sevenDaysAgo.toISOString());

  for (const ev of evalsBrouillon ?? []) {
    const emp = Array.isArray(ev.employees) ? ev.employees[0] : ev.employees;
    const titre = `Évaluation en attente : ${emp?.full_name ?? "Employé"} — ${ev.periode}`;

    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("company_id", companyId)
      .eq("titre", titre)
      .limit(1)
      .single();

    if (existing) continue;

    await supabase.from("notifications").insert({
      company_id: companyId,
      type: "evaluation",
      titre,
      message: `L'évaluation de ${emp?.full_name} pour la période ${ev.periode} est en brouillon depuis plus de 7 jours.`,
    });
    created++;
  }

  // 3. Visites médicales expirantes (dans les 30 prochains jours)
  const nextMonth = new Date(today);
  nextMonth.setDate(today.getDate() + 30);
  const nextMonthStr = nextMonth.toISOString().split("T")[0];

  const { data: medicalExams } = await supabase
    .from("medical_exams")
    .select("id, type, date_expiration, employees(full_name)")
    .eq("company_id", companyId)
    .lte("date_expiration", nextMonthStr)
    .gte("date_expiration", today.toISOString().split("T")[0]);

  for (const exam of medicalExams ?? []) {
    const emp = Array.isArray(exam.employees) ? exam.employees[0] : exam.employees;
    const titre = `Visite médicale : ${emp?.full_name ?? "Employé"}`;
    
    // Vérifier doublon
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("company_id", companyId)
      .eq("titre", titre)
      .limit(1)
      .single();

    if (existing) continue;

    await supabase.from("notifications").insert({
      company_id: companyId,
      type: "info",
      titre,
      message: `La visite médicale (${exam.type}) de ${emp?.full_name} expire le ${formatDateLocal(exam.date_expiration!)}.`,
    });
    created++;
  }

  // 4. Documents manquants (Audit périodique)
  // On ne le fait que si on n'a pas généré d'alerte document récemment pour cet employé
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, documents(famille)")
    .eq("company_id", companyId)
    .eq("statut", "actif");

  const DOCS_OBLIGATOIRES = [
    "CNI / Passeport",
    "Contrat",
    "CV",
    "Casier judiciaire",
    "Certificat de travail",
  ];

  for (const emp of employees ?? []) {
    const familles = new Set(emp.documents?.map((d: any) => d.famille));
    const manquants = DOCS_OBLIGATOIRES.filter(d => !familles.has(d));

    if (manquants.length > 0) {
      const titre = `Dossier incomplet : ${emp.full_name}`;
      
      // On ne crée une notification que si elle n'existe pas déjà ou si elle date de plus de 30 jours
      const { data: existing } = await supabase
        .from("notifications")
        .select("id, created_at")
        .eq("company_id", companyId)
        .eq("titre", titre)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        const lastCreated = new Date(existing.created_at!);
        const diffDays = Math.floor((today.getTime() - lastCreated.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 30) continue; // Pas d'alerte plus d'une fois par mois
      }

      await supabase.from("notifications").insert({
        company_id: companyId,
        type: "alerte_contrat",
        titre,
        message: `Le dossier de ${emp.full_name} est incomplet. Documents manquants : ${manquants.join(", ")}.`,
      });
      created++;
    }
  }

  // 5. Fins de période d'essai (dans les 10 prochains jours)
  const trialLimit = new Date(today);
  trialLimit.setDate(today.getDate() + 10);
  const trialLimitStr = trialLimit.toISOString().split("T")[0];

  const { data: trialContracts } = await supabase
    .from("contracts")
    .select("id, date_fin_essai, employees(full_name, poste)")
    .eq("company_id", companyId)
    .eq("statut", "actif")
    .lte("date_fin_essai", trialLimitStr)
    .gte("date_fin_essai", today.toISOString().split("T")[0]);

  for (const c of trialContracts ?? []) {
    const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
    const titre = `Fin d'essai : ${emp?.full_name}`;
    
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("company_id", companyId)
      .eq("titre", titre)
      .limit(1)
      .single();

    if (existing) continue;

    await supabase.from("notifications").insert({
      company_id: companyId,
      type: "alerte_contrat",
      titre,
      message: `La période d'essai de ${emp?.full_name} (${emp?.poste}) se termine le ${formatDateLocal(c.date_fin_essai!)}. Une décision (confirmation/rupture/renouvellement) doit être prise.`,
    });
    created++;
  }

  return created;
}

