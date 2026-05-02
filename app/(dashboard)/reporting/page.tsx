import { createServerClient } from "@/lib/supabase/server";
import { ReportingClient } from "./ReportingClient";

export const dynamic = "force-dynamic";

export default async function ReportingPage() {
  const supabase = createServerClient();

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  const periodY = twelveMonthsAgo.getFullYear();
  const periodM = twelveMonthsAgo.getMonth() + 1;
  const periodStart = `${periodY}-${String(periodM).padStart(2, "0")}`;

  const [bulletinsRes, congesRes, employeesRes, evaluationsRes, accidentsRes] = await Promise.all([
    supabase
      .from("bulletins_paie")
      .select("periode, salaire_brut, salaire_net, cnps_salarie, its, total_contributions, net_to_pay")
      .gte("periode", periodStart)
      .order("periode"),
    supabase
      .from("conges")
      .select("statut")
      .eq("statut", "en_attente"),
    supabase
      .from("employees")
      .select("statut, date_embauche, updated_at"),
    supabase
      .from("evaluations")
      .select("score_global")
      .gte("date_prevue", yearStart),
    supabase
      .from("work_accidents")
      .select("id", { count: "exact", head: true })
      .gte("date_accident", yearStart),
  ]);

  // Build monthly mass salariale
  const bulletins = bulletinsRes.data ?? [];
  const byPeriod = new Map<string, { brut: number; net: number; cotisations: number; count: number }>();
  for (const b of bulletins) {
    const bRec = b as Record<string, unknown>;
    const cotisations = Number(bRec.total_contributions ?? (Number(b.cnps_salarie) + Number(b.its)));
    const netPay = Number(bRec.net_to_pay ?? b.salaire_net);
    const prev = byPeriod.get(b.periode) ?? { brut: 0, net: 0, cotisations: 0, count: 0 };
    byPeriod.set(b.periode, {
      brut: prev.brut + b.salaire_brut,
      net: prev.net + netPay,
      cotisations: prev.cotisations + cotisations,
      count: prev.count + 1,
    });
  }

  const masseSalariale = Array.from(byPeriod.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periode, vals]) => ({
      periode,
      masse_brute: vals.brut,
      masse_nette: vals.net,
      cnps_total: vals.cotisations,
      its_total: 0,
      nb_bulletins: vals.count,
    }));

  // KPIs
  const employees = employeesRes.data ?? [];
  const effectif_actif = employees.filter((e) => e.statut === "actif").length;
  const effectif_essai = employees.filter((e) => e.statut === "essai").length;

  const departsAnnee = employees.filter(
    (e) => e.statut === "inactif" || e.statut === "depart"
  ).length; // Simplify since we do not have a dedicated date_depart column, we assume inactifs are departures

  const turn_over_annee = effectif_actif > 0
    ? Math.round((departsAnnee / effectif_actif) * 100)
    : 0;

  const conges_en_attente = congesRes.data?.length ?? 0;

  const evals = evaluationsRes.data ?? [];
  const score_eval_moyen = evals.length > 0
    ? Math.round((evals.reduce((s, e) => s + (e.score_global ?? 0), 0) / evals.length) * 10) / 10
    : null;

  const accidents_annee = accidentsRes.count ?? 0;

  const kpis = {
    effectif_actif,
    effectif_essai,
    turn_over_annee,
    conges_en_attente,
    score_eval_moyen,
    accidents_annee,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reporting RH</h1>
        <p className="text-sm text-slate-600 mt-1">
          Analytics masse salariale · KPIs RH · Export CSV multi-onglets
        </p>
      </div>
      <ReportingClient masseSalariale={masseSalariale} kpis={kpis} />
    </div>
  );
}
