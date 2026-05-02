import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { computeFdfpCredit, computeTrainingEffort } from "@/lib/fdfp";
import { FormationClient, type TrainingAction } from "./FormationClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plan de formation FDFP — RH Manager CI" };

export default async function FormationPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) redirect("/onboarding");

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  const [{ data: trainings }, { data: bulletins }, { data: employees }] = await Promise.all([
    supabase
      .from("training_actions")
      .select(`
        id, intitule, organisme, modality, domaine, date_debut, date_fin,
        duree_heures, cout_total, statut, fdfp_eligible, fdfp_remboursement,
        training_participants(employee_id)
      `)
      .eq("company_id", companyId as string)
      .order("date_debut", { ascending: false }),
    supabase
      .from("bulletins_paie")
      .select("salaire_brut, periode")
      .eq("company_id", companyId as string)
      .gte("periode", `${currentYear}-01`)
      .lte("periode", `${currentYear}-12`),
    supabase
      .from("employees")
      .select("id, full_name, matricule")
      .eq("company_id", companyId as string)
      .eq("statut", "actif")
      .order("full_name"),
  ]);

  const masseSalariale = (bulletins ?? []).reduce(
    (s, b) => s + Number(b.salaire_brut ?? 0),
    0
  );
  const credit = computeFdfpCredit(masseSalariale);

  const trainingActions: TrainingAction[] = (trainings ?? []).map((t) => ({
    id: t.id,
    intitule: t.intitule,
    organisme: t.organisme,
    modality: t.modality,
    domaine: t.domaine,
    date_debut: t.date_debut,
    date_fin: t.date_fin,
    duree_heures: Number(t.duree_heures ?? 0),
    cout_total: Number(t.cout_total ?? 0),
    statut: t.statut,
    fdfp_eligible: t.fdfp_eligible ?? true,
    fdfp_remboursement: Number(t.fdfp_remboursement ?? 0),
    nb_participants: Array.isArray(t.training_participants) ? t.training_participants.length : 0,
  }));

  const totalCout = trainingActions.reduce((s, t) => s + t.cout_total, 0);
  const totalRembourse = trainingActions.reduce((s, t) => s + t.fdfp_remboursement, 0);
  const totalHeures = trainingActions.reduce((s, t) => s + t.duree_heures, 0);
  const tauxEffort = computeTrainingEffort(totalCout, masseSalariale);

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <FormationClient
        actions={trainingActions}
        employees={employees ?? []}
        kpi={{
          masseSalariale,
          creditFdfp: credit.fdfp,
          creditApprentissage: credit.apprentissage,
          creditTotal: credit.total,
          totalCout,
          totalRembourse,
          totalHeures,
          tauxEffort,
          year: currentYear,
        }}
      />
    </div>
  );
}
