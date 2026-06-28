export const dynamic = 'force-dynamic';
export const metadata = { title: "Anomalies de paie — RH Manager CI" };

import { createServerClient } from "@/lib/supabase/server";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import Link from "next/link";
import {
  AlertTriangle, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, Activity, FileWarning,
} from "lucide-react";

interface PageProps {
  searchParams: { periode?: string };
}

interface Bulletin {
  id: string;
  employee_id: string;
  periode: string;
  salaire_brut: number;
  salaire_net: number;
  cnps_salarie: number;
  its: number;
  avances: number;
  autres_retenues: number;
  employees: { full_name: string; matricule: string; poste: string } | null;
}

type Severity = "critique" | "eleve" | "moyen" | "info";

interface Anomalie {
  employeeId: string;
  fullName: string;
  matricule: string;
  poste: string;
  periode: string;
  type: string;
  description: string;
  severity: Severity;
  current: number;
  baseline: number;
  deltaPct: number;
}

function fmtFcfa(n: number): string {
  return new Intl.NumberFormat("fr-CI", { maximumFractionDigits: 0 }).format(n) + " FCFA";
}

function currentPeriode(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function prevPeriode(p: string, n: number): string {
  const [y, m] = p.split("-").map(Number);
  const d = new Date(y, m - 1 - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string; dot: string }> = {
  critique: { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500" },
  eleve:    { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  moyen:    { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500" },
  info:     { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500" },
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critique: "Critique",
  eleve: "Élevée",
  moyen: "Moyenne",
  info: "Info",
};

export default async function AnomaliesPaiePage({ searchParams }: PageProps) {
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .single();
  if (!profile?.company_id) return null;

  const periode = searchParams.periode || currentPeriode();
  const refPeriodes = [
    prevPeriode(periode, 1),
    prevPeriode(periode, 2),
    prevPeriode(periode, 3),
  ];

  const { data: current } = await supabase
    .from("bulletins_paie")
    .select("id, employee_id, periode, salaire_brut, salaire_net, cnps_salarie, its, avances, autres_retenues, employees(full_name, matricule, poste)")
    .eq("company_id", profile.company_id)
    .eq("periode", periode);

  const { data: previous } = await supabase
    .from("bulletins_paie")
    .select("id, employee_id, periode, salaire_brut, salaire_net, cnps_salarie, its, avances, autres_retenues, employees(full_name, matricule, poste)")
    .eq("company_id", profile.company_id)
    .in("periode", refPeriodes);

  const { data: activeEmployees } = await supabase
    .from("employees")
    .select("id, full_name, matricule, poste, salaire_brut")
    .eq("company_id", profile.company_id)
    .eq("statut", "actif");

  const currentList = (current ?? []) as unknown as Bulletin[];
  const previousList = (previous ?? []) as unknown as Bulletin[];

  // Baseline par employé (moyenne 3 derniers mois)
  const baselineByEmp: Record<string, { brut: number; net: number; count: number }> = {};
  previousList.forEach((b) => {
    if (!baselineByEmp[b.employee_id]) {
      baselineByEmp[b.employee_id] = { brut: 0, net: 0, count: 0 };
    }
    baselineByEmp[b.employee_id].brut += b.salaire_brut ?? 0;
    baselineByEmp[b.employee_id].net += b.salaire_net ?? 0;
    baselineByEmp[b.employee_id].count++;
  });

  const anomalies: Anomalie[] = [];

  // 1. Détection variation +/- significative
  currentList.forEach((b) => {
    const emp = b.employees;
    if (!emp) return;
    const base = baselineByEmp[b.employee_id];
    if (!base || base.count === 0) return;
    const avgBrut = base.brut / base.count;
    const avgNet = base.net / base.count;

    if (avgBrut > 0) {
      const delta = ((b.salaire_brut - avgBrut) / avgBrut) * 100;
      if (Math.abs(delta) >= 30) {
        anomalies.push({
          employeeId: b.employee_id,
          fullName: emp.full_name,
          matricule: emp.matricule,
          poste: emp.poste,
          periode: b.periode,
          type: delta > 0 ? "Hausse importante du brut" : "Baisse importante du brut",
          description: `Salaire brut ${delta > 0 ? "supérieur" : "inférieur"} de ${Math.abs(delta).toFixed(0)}% à la moyenne des 3 derniers mois.`,
          severity: Math.abs(delta) >= 50 ? "critique" : "eleve",
          current: b.salaire_brut,
          baseline: Math.round(avgBrut),
          deltaPct: delta,
        });
      } else if (Math.abs(delta) >= 15) {
        anomalies.push({
          employeeId: b.employee_id,
          fullName: emp.full_name,
          matricule: emp.matricule,
          poste: emp.poste,
          periode: b.periode,
          type: delta > 0 ? "Variation du brut à la hausse" : "Variation du brut à la baisse",
          description: `Variation du salaire brut de ${delta > 0 ? "+" : ""}${delta.toFixed(0)}% par rapport à la moyenne.`,
          severity: "moyen",
          current: b.salaire_brut,
          baseline: Math.round(avgBrut),
          deltaPct: delta,
        });
      }
    }

    // Retenues anormales
    const retenues = (b.avances ?? 0) + (b.autres_retenues ?? 0);
    if (retenues > b.salaire_brut * 0.5) {
      anomalies.push({
        employeeId: b.employee_id,
        fullName: emp.full_name,
        matricule: emp.matricule,
        poste: emp.poste,
        periode: b.periode,
        type: "Retenues élevées",
        description: `Retenues (${fmtFcfa(retenues)}) dépassent 50% du salaire brut.`,
        severity: "eleve",
        current: retenues,
        baseline: Math.round(b.salaire_brut * 0.5),
        deltaPct: ((retenues - b.salaire_brut * 0.5) / (b.salaire_brut * 0.5)) * 100,
      });
    }

    // Net négatif
    if (b.salaire_net <= 0) {
      anomalies.push({
        employeeId: b.employee_id,
        fullName: emp.full_name,
        matricule: emp.matricule,
        poste: emp.poste,
        periode: b.periode,
        type: "Net à payer ≤ 0",
        description: `Le salaire net à payer est de ${fmtFcfa(b.salaire_net)} — risque d'erreur de calcul.`,
        severity: "critique",
        current: b.salaire_net,
        baseline: Math.round(avgNet || 0),
        deltaPct: -100,
      });
    }
  });

  // 2. Bulletins manquants (employé actif sans bulletin)
  const currentEmpIds = new Set(currentList.map((b) => b.employee_id));
  (activeEmployees ?? []).forEach((emp) => {
    if (!currentEmpIds.has(emp.id) && baselineByEmp[emp.id]?.count > 0) {
      anomalies.push({
        employeeId: emp.id,
        fullName: emp.full_name,
        matricule: emp.matricule,
        poste: emp.poste,
        periode,
        type: "Bulletin manquant",
        description: `Employé actif sans bulletin pour cette période, alors qu'il en avait les mois précédents.`,
        severity: "eleve",
        current: 0,
        baseline: emp.salaire_brut ?? 0,
        deltaPct: -100,
      });
    }
  });

  // Tri : critique → élevé → moyen → info, puis par |deltaPct|
  const severityOrder: Record<Severity, number> = { critique: 0, eleve: 1, moyen: 2, info: 3 };
  anomalies.sort((a, b) => {
    const so = severityOrder[a.severity] - severityOrder[b.severity];
    return so !== 0 ? so : Math.abs(b.deltaPct) - Math.abs(a.deltaPct);
  });

  const byseverity = {
    critique: anomalies.filter((a) => a.severity === "critique").length,
    eleve: anomalies.filter((a) => a.severity === "eleve").length,
    moyen: anomalies.filter((a) => a.severity === "moyen").length,
    info: anomalies.filter((a) => a.severity === "info").length,
  };
  const totalControle = currentList.length;
  const tauxAnomalie = totalControle ? Math.round((anomalies.length / totalControle) * 100) : 0;

  return (
    <PageShell>
      <PageHeader
        title="Détection d'anomalies de paie"
        description={`Analyse automatique du bulletin ${periode} par rapport aux 3 mois précédents — variations, retenues, manquants.`}
        help="Repère automatiquement les écarts et erreurs de paie (salaires hors barème, cotisations incohérentes, doublons) avant de valider les bulletins."
      />

      {/* Sélecteur de période + KPIs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <form method="GET" className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Période</label>
          <input
            type="month"
            name="periode"
            defaultValue={periode}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Analyser
          </button>
        </form>
      </div>

      {/* KPIs sévérité */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
            <Activity className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Bulletins analysés</p>
            <p className="text-xl font-bold text-slate-800">{totalControle}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50/40 shadow-sm p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-700">Critiques</p>
            <p className="text-xl font-bold text-red-700">{byseverity.critique}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50/40 shadow-sm p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-700">Élevées</p>
            <p className="text-xl font-bold text-orange-700">{byseverity.eleve}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 shadow-sm p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <FileWarning className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Moyennes</p>
            <p className="text-xl font-bold text-amber-700">{byseverity.moyen}</p>
          </div>
        </div>
        <div className={`rounded-2xl border shadow-sm p-4 flex items-center gap-3 ${
          tauxAnomalie === 0
            ? "border-emerald-100 bg-emerald-50/40"
            : tauxAnomalie < 10
            ? "border-amber-100 bg-amber-50/40"
            : "border-red-100 bg-red-50/40"
        }`}>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
            tauxAnomalie === 0 ? "bg-emerald-100" : tauxAnomalie < 10 ? "bg-amber-100" : "bg-red-100"
          }`}>
            {tauxAnomalie === 0 ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Taux d'anomalie</p>
            <p className="text-xl font-bold text-slate-800">{tauxAnomalie}%</p>
          </div>
        </div>
      </div>

      {/* Liste des anomalies */}
      {anomalies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-16 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
          <h3 className="text-base font-semibold text-emerald-700">Aucune anomalie détectée</h3>
          <p className="mt-1 text-sm text-emerald-600 max-w-md mx-auto">
            Tous les bulletins de la période <span className="font-mono font-semibold">{periode}</span> sont conformes
            aux tendances historiques. {totalControle > 0 ? `${totalControle} bulletins analysés.` : "Aucun bulletin pour cette période."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {anomalies.length} anomalie{anomalies.length > 1 ? "s" : ""} détectée{anomalies.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-slate-500">Triées par sévérité</p>
          </div>
          <div className="divide-y divide-slate-50">
            {anomalies.map((a, idx) => {
              const sc = SEVERITY_COLORS[a.severity];
              return (
                <div key={`${a.employeeId}-${idx}`} className="px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Sévérité */}
                    <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${sc.dot}`} />

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/employes/${a.employeeId}`}
                              className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                            >
                              {a.fullName}
                            </Link>
                            <span className="text-xs font-mono text-slate-400">{a.matricule}</span>
                            <span className={`inline-flex items-center rounded-full ${sc.bg} ${sc.text} ${sc.border} border px-2 py-0.5 text-[10px] font-semibold`}>
                              {SEVERITY_LABELS[a.severity]}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{a.poste}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {a.deltaPct !== 0 && Math.abs(a.deltaPct) < 999 && (
                            <div className={`inline-flex items-center gap-1 text-sm font-bold ${
                              a.deltaPct > 0 ? "text-red-600" : "text-amber-600"
                            }`}>
                              {a.deltaPct > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {a.deltaPct > 0 ? "+" : ""}{a.deltaPct.toFixed(0)}%
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-slate-700">{a.type}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>

                      {a.baseline > 0 && (
                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <span className="text-slate-400">
                            Période : <span className="font-mono text-slate-600">{fmtFcfa(a.current)}</span>
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-400">
                            Référence : <span className="font-mono text-slate-600">{fmtFcfa(a.baseline)}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Note méthodologie */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 text-xs text-slate-500 leading-relaxed">
        <p className="font-semibold text-slate-600 mb-1">Méthodologie</p>
        <ul className="list-disc list-inside space-y-0.5 ml-1">
          <li><span className="font-semibold">Critique</span> : variation ≥ 50%, net négatif ou nul.</li>
          <li><span className="font-semibold">Élevée</span> : variation 30-50%, retenues &gt; 50% du brut, bulletin manquant.</li>
          <li><span className="font-semibold">Moyenne</span> : variation 15-30% par rapport à la moyenne des 3 mois précédents.</li>
          <li>Référence calculée sur les 3 bulletins précédents. Pas d'analyse si historique &lt; 1 bulletin.</li>
        </ul>
      </div>
    </PageShell>
  );
}
