import { createServerClient } from "@/lib/supabase/server";
import { RisqueDepartTable } from "@/components/rh/RisqueDepartTable";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import {
  applyFactor,
  getRiskLevel,
  type AppliedFactor,
  type RisqueDepartRow,
} from "@/lib/risque-depart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Risque de départ — RH Manager CI" };

export default async function RisqueDepartPage() {
  const supabase = createServerClient();

  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const in60Days = new Date(now);
  in60Days.setDate(in60Days.getDate() + 60);

  const [
    { data: employees },
    { data: bulletins },
    { data: evaluations },
    { data: conges },
    { data: contracts },
    { data: contentieux },
    { data: formations },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, poste, departement, date_embauche, photo_url, statut")
      .eq("statut", "actif"),
    supabase.from("bulletins_paie").select("employee_id, periode, salaire_brut").order("periode", { ascending: false }),
    supabase
      .from("evaluations")
      .select("employee_id, score_global, date_realisation")
      .eq("statut", "valide")
      .order("date_realisation", { ascending: false }),
    supabase
      .from("conges")
      .select("employee_id, nb_jours, date_debut")
      .eq("statut", "approuve")
      .gte("date_debut", oneYearAgo.toISOString().slice(0, 10)),
    supabase.from("contracts").select("employee_id, type_contrat, date_fin, statut").eq("statut", "actif"),
    supabase.from("legal_cases").select("employee_id, statut").in("statut", ["ouvert", "en_cours"]),
    supabase.from("formation_inscriptions").select("employee_id, created_at").order("created_at", { ascending: false }),
  ]);

  // Index par employé
  const evalsByEmp = new Map<string, { score_global: number }[]>();
  (evaluations ?? []).forEach((e) => {
    const arr = evalsByEmp.get(e.employee_id) ?? [];
    arr.push(e);
    evalsByEmp.set(e.employee_id, arr);
  });
  const bulletinsByEmp = new Map<string, { salaire_brut: number; periode: string }[]>();
  (bulletins ?? []).forEach((b) => {
    const arr = bulletinsByEmp.get(b.employee_id) ?? [];
    arr.push(b);
    bulletinsByEmp.set(b.employee_id, arr);
  });
  const congesByEmp = new Map<string, number>();
  (conges ?? []).forEach((c) => {
    congesByEmp.set(c.employee_id, (congesByEmp.get(c.employee_id) ?? 0) + (c.nb_jours ?? 0));
  });
  const contractByEmp = new Map<string, { type_contrat: string; date_fin: string | null }>();
  (contracts ?? []).forEach((c) => contractByEmp.set(c.employee_id, c));
  const litigeEmps = new Set<string>((contentieux ?? []).map((c) => c.employee_id));
  const lastFormationByEmp = new Map<string, string>();
  (formations ?? []).forEach((f) => {
    if (!lastFormationByEmp.has(f.employee_id)) lastFormationByEmp.set(f.employee_id, f.created_at);
  });

  const data: RisqueDepartRow[] = (employees ?? []).map((emp) => {
    const facteurs: AppliedFactor[] = [];

    const embauche = emp.date_embauche ? new Date(emp.date_embauche) : null;
    const ancienneteAns = embauche ? (now.getTime() - embauche.getTime()) / (365.25 * 24 * 3600 * 1000) : 0;
    if (embauche && ancienneteAns < 1) facteurs.push(applyFactor("anciennete", `${ancienneteAns.toFixed(1)} an`));

    // Stagnation salariale (récent vs 2 ans+)
    const empBul = (bulletinsByEmp.get(emp.id) ?? []).slice().sort((a, b) => b.periode.localeCompare(a.periode));
    if (empBul.length >= 2) {
      const recent = empBul.slice(0, 3);
      const old = empBul.filter((b) => b.periode < twoYearsAgo.toISOString().slice(0, 7)).slice(0, 3);
      if (old.length > 0) {
        const avgRecent = recent.reduce((s, b) => s + b.salaire_brut, 0) / recent.length;
        const avgOld = old.reduce((s, b) => s + b.salaire_brut, 0) / old.length;
        if (avgOld > 0 && (avgRecent - avgOld) / avgOld < 0.02) facteurs.push(applyFactor("no_raise"));
      }
    }

    // Dernière évaluation < 60/100 (score_global sur 5 → /100)
    const empEvals = evalsByEmp.get(emp.id) ?? [];
    if (empEvals.length > 0) {
      const on100 = (empEvals[0].score_global / 5) * 100;
      if (on100 < 60) facteurs.push(applyFactor("low_eval", `${Math.round(on100)}/100`));
    }

    // Absences > 15 j/an
    const abs = congesByEmp.get(emp.id) ?? 0;
    if (abs > 15) facteurs.push(applyFactor("absences", `${abs} j/an`));

    // CDD expirant < 60j
    const contrat = contractByEmp.get(emp.id);
    if (contrat?.type_contrat === "CDD" && contrat.date_fin) {
      const fin = new Date(contrat.date_fin);
      if (fin <= in60Days && fin >= now) {
        const jours = Math.ceil((fin.getTime() - now.getTime()) / (24 * 3600 * 1000));
        facteurs.push(applyFactor("cdd_expiring", `${jours} j restants`));
      }
    }

    // Contentieux ouvert
    if (litigeEmps.has(emp.id)) facteurs.push(applyFactor("litige"));

    // Aucune formation depuis 1+ an
    const lastForm = lastFormationByEmp.get(emp.id);
    if (!lastForm || new Date(lastForm) < oneYearAgo) facteurs.push(applyFactor("no_training"));

    const score = Math.min(facteurs.reduce((s, f) => s + f.points, 0), 100);

    return {
      employee_id: emp.id,
      full_name: emp.full_name ?? "—",
      poste: emp.poste ?? "—",
      departement: emp.departement ?? "—",
      photo_url: (emp as { photo_url?: string | null }).photo_url ?? null,
      anciennete_ans: ancienneteAns,
      score,
      niveau: getRiskLevel(score),
      facteurs,
    };
  });

  data.sort((a, b) => b.score - a.score);

  return (
    <PageShell>
      <PageHeader
        title="Risque de départ"
        description="Analyse prédictive du turnover — score 0–100 calculé à partir de 7 signaux RH pondérés."
      />
      <RisqueDepartTable data={data} />
    </PageShell>
  );
}
