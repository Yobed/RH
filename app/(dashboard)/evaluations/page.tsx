export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import PerformanceReviewManager from "@/components/rh/PerformanceReviewManager";
import { Suspense } from "react";

export const metadata = { title: "Performance & Évaluations — RH Manager CI" };

type EvaluationRow = {
  id: string;
  employee_id: string;
  type: string;
  periode: string;
  date_prevue: string;
  date_realisation: string | null;
  statut: string;
  score_global: number | null;
  titre: string;
  evaluateur_id: string | null;
  score?: number | null;
  employees?: { full_name?: string; poste?: string } | { full_name?: string; poste?: string }[] | null;
  [key: string]: unknown;
};

export default async function EvaluationsPage() {
  const supabase = createServerClient();

  const [{ data: evaluations }, { data: employees }] = await Promise.all([
    supabase
      .from("evaluations")
      .select(`
        *,
        employees:employee_id (full_name, poste)
      `)
      .order("date_prevue", { ascending: false }),
    supabase
      .from("employees")
      .select("id, full_name, poste")
      .eq("statut", "actif")
      .order("full_name"),
  ]);

  const formattedEvaluations = (evaluations || []).map((ev: EvaluationRow) => ({
    ...ev,
    employee_name: (Array.isArray(ev.employees) ? ev.employees[0]?.full_name : ev.employees?.full_name) || 'Inconnu',
    employee_role: (Array.isArray(ev.employees) ? ev.employees[0]?.poste : ev.employees?.poste) || 'N/A',
  }));

  // KPI computation
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const evsCeTrimestre = formattedEvaluations.filter((ev) => {
    if (!ev.date_prevue) return false;
    return new Date(ev.date_prevue as string) >= quarterStart;
  }).length;

  const scores = formattedEvaluations
    .filter((ev) => ev.score != null)
    .map((ev) => ev.score as number);
  const scoreMoyen = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null;

  const enAttente = formattedEvaluations.filter(
    (ev) => ev.statut === "planifiee" || ev.statut === "en_cours"
  ).length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Performance & Évaluations</h1>
        <p className="text-sm text-slate-400">Suivi des évaluations périodiques et scores de performance</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Ce trimestre</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{evsCeTrimestre}</p>
          <p className="mt-1 text-xs text-slate-400">évaluations planifiées</p>
        </div>
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Score moyen</p>
          <p className={`mt-2 text-3xl font-bold font-mono ${
            scoreMoyen == null
              ? "text-slate-300"
              : scoreMoyen >= 14
              ? "text-emerald-600"
              : scoreMoyen >= 10
              ? "text-amber-600"
              : "text-red-500"
          }`}>
            {scoreMoyen != null ? scoreMoyen : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-400">sur l'ensemble des évaluations</p>
        </div>
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">En attente</p>
          <p className={`mt-2 text-3xl font-bold ${enAttente > 0 ? "text-amber-600" : "text-slate-900"}`}>
            {enAttente}
          </p>
          <p className="mt-1 text-xs text-slate-400">à compléter</p>
        </div>
      </div>

      {/* Manager component */}
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[oklch(0.175_0.04_248)]" />
        </div>
      }>
        <PerformanceReviewManager
          initialEvaluations={formattedEvaluations}
          employees={employees ?? []}
        />
      </Suspense>
    </div>
  );
}
