import { PageShell } from "@/components/ui/page-shell";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { applyFilters, computeEffectif, computeAgePyramid, computePayroll, computeTurnover, computeAbsenteeism, computeSafety, computePerformance } from "@/lib/analytics-rh";
import { computeFdfpCredit, computeTrainingEffort } from "@/lib/fdfp";
import { BilanSocialClient } from "./BilanSocialClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bilan social — RH Manager CI" };

export default async function BilanSocialPage({
  searchParams,
}: {
  searchParams: Promise<{ annee?: string }>;
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) redirect("/onboarding");

  const sp = await searchParams;
  const annee = sp?.annee ? parseInt(sp.annee, 10) : new Date().getFullYear();
  const yearRef = new Date(annee, 11, 31);

  const [
    { data: company },
    { data: employees },
    { data: bulletins },
    { data: contracts },
    { data: conges },
    { data: medical },
    { data: jobPostings },
    { data: candidates },
    { data: evaluations },
    { data: accidents },
    { data: trainings },
    { data: duerp },
  ] = await Promise.all([
    supabase.from("companies").select("name, raison_sociale").eq("id", companyId as string).single(),
    supabase
      .from("employees")
      .select("id, full_name, date_embauche, date_naissance, genre, statut, departement, categorie")
      .eq("company_id", companyId as string),
    supabase
      .from("bulletins_paie")
      .select("id, employee_id, periode, salaire_brut, salaire_net, its, cnps_salarie, prime_transport, sursalaire, total_contributions, net_to_pay, tax_cn, tax_igr, withholding_cnps")
      .eq("company_id", companyId as string)
      .gte("periode", `${annee}-01`)
      .lte("periode", `${annee}-12`),
    supabase
      .from("contracts")
      .select("employee_id, date_debut, date_fin, statut")
      .eq("company_id", companyId as string),
    supabase
      .from("conges")
      .select("employee_id, date_debut, date_fin, nb_jours, statut, type")
      .eq("company_id", companyId as string)
      .gte("date_debut", `${annee}-01-01`)
      .lte("date_debut", `${annee}-12-31`),
    supabase
      .from("medical_exams")
      .select("id, employee_id, resultat, prochaine_visite")
      .eq("company_id", companyId as string),
    supabase
      .from("job_postings")
      .select("id, titre, created_at, statut, date_limite")
      .eq("company_id", companyId as string)
      .gte("created_at", `${annee}-01-01`)
      .lte("created_at", `${annee}-12-31`),
    supabase
      .from("candidates")
      .select("id, job_id, created_at, statut, score_ia")
      .eq("company_id", companyId as string)
      .gte("created_at", `${annee}-01-01`)
      .lte("created_at", `${annee}-12-31`),
    supabase
      .from("evaluations")
      .select("id, employee_id, score_global, potential_score, date_realisation, type, statut")
      .eq("company_id", companyId as string)
      .gte("date_realisation", `${annee}-01-01`)
      .lte("date_realisation", `${annee}-12-31`),
    supabase
      .from("work_accidents")
      .select("id, employee_id, date_accident, jours_arret, gravite")
      .eq("company_id", companyId as string)
      .gte("date_accident", `${annee}-01-01`)
      .lte("date_accident", `${annee}-12-31`),
    supabase
      .from("training_actions")
      .select("id, intitule, duree_heures, cout_total, statut, fdfp_remboursement, training_participants(employee_id)")
      .eq("company_id", companyId as string)
      .gte("date_debut", `${annee}-01-01`)
      .lte("date_debut", `${annee}-12-31`),
    supabase
      .from("duerp_risks")
      .select("id, severity, status")
      .eq("company_id", companyId as string),
  ]);

  const dataset = {
    employees: employees ?? [],
    bulletins: bulletins ?? [],
    contracts: contracts ?? [],
    conges: conges ?? [],
    medical: medical ?? [],
    jobPostings: jobPostings ?? [],
    candidates: candidates ?? [],
    evaluations: evaluations ?? [],
    accidents: accidents ?? [],
  };

  const filtered = applyFilters(dataset, {});
  const effectif = computeEffectif(filtered, yearRef);
  const age = computeAgePyramid(filtered, yearRef);
  const payroll = computePayroll(filtered, yearRef);
  const turnover = computeTurnover(filtered, yearRef);
  const absenteeism = computeAbsenteeism(filtered, yearRef);
  const safety = computeSafety(filtered, yearRef);
  const performance = computePerformance(filtered);

  const totalCoutFormation = (trainings ?? []).reduce((s, t) => s + Number(t.cout_total ?? 0), 0);
  const totalHeuresFormation = (trainings ?? []).reduce((s, t) => s + Number(t.duree_heures ?? 0), 0);
  const fdfpCredit = computeFdfpCredit(payroll.ytdBrut);
  const tauxEffort = computeTrainingEffort(totalCoutFormation, payroll.ytdBrut);
  const trainedEmployees = new Set(
    (trainings ?? []).flatMap((t) =>
      Array.isArray(t.training_participants)
        ? t.training_participants.map((p: { employee_id: string }) => p.employee_id)
        : []
    )
  );

  const duerpStats = {
    total: (duerp ?? []).length,
    critiques: (duerp ?? []).filter((d) => d.severity === "critique").length,
    elevees: (duerp ?? []).filter((d) => d.severity === "elevee").length,
    maitrises: (duerp ?? []).filter((d) => d.status === "maitrise").length,
  };

  const yearsOptions = Array.from(new Set([annee, new Date().getFullYear(), new Date().getFullYear() - 1])).sort((a, b) => b - a);

  return (
    <PageShell>
      <BilanSocialClient
        annee={annee}
        yearsOptions={yearsOptions}
        companyName={company?.raison_sociale ?? company?.name ?? "Entreprise"}
        effectif={effectif}
        age={age}
        payroll={{
          brut_annuel: payroll.ytdBrut,
          cout_total_annuel: payroll.ytdCoutTotal,
          brut_moyen_mensuel: payroll.averageBrutPerEmployee,
        }}
        turnover={turnover}
        absenteeism={absenteeism}
        safety={safety}
        performance={performance}
        formation={{
          nb_actions: (trainings ?? []).length,
          nb_employees_formes: trainedEmployees.size,
          total_heures: totalHeuresFormation,
          total_cout: totalCoutFormation,
          fdfp_credit: fdfpCredit.total,
          fdfp_rembourse: (trainings ?? []).reduce((s, t) => s + Number(t.fdfp_remboursement ?? 0), 0),
          taux_effort: tauxEffort,
        }}
        duerp={duerpStats}
        recrutement={{
          jobs_ouverts: (jobPostings ?? []).length,
          candidats: (candidates ?? []).length,
          recrutes: (candidates ?? []).filter((c) => c.statut === "recrute").length,
        }}
      />
    </PageShell>
  );
}
