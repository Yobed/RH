/**
 * POST /api/notifications/sync
 * Génère automatiquement les notifications pour :
 * - Contrats CDD expirant dans 30j, 15j, 7j, 1j
 * - Évaluations en brouillon depuis + de 7j
 * Peut être appelé par n8n (cron quotidien) ou manuellement.
 */
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
    const managerIds = [
      ...new Set(
        contracts
          ?.map((c) => (c.employees as unknown as { manager_id: string | null }).manager_id)
          .filter((id): id is string => !!id)
      ),
    ];
    const managerNames: Record<string, string> = {};
    if (managerIds.length > 0) {
      const { data: managers } = await supabase
        .from("employees")
        .select("id, full_name")
        .in("id", managerIds);
      managers?.forEach((m) => { managerNames[m.id] = m.full_name; });
    }

    for (const c of contracts ?? []) {
      const emp = c.employees as unknown as {
        full_name: string;
        poste: string;
        manager_id: string | null;
      } | null;
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
    const emp = ev.employees as unknown as { full_name: string } | null;
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

  return created;
}
