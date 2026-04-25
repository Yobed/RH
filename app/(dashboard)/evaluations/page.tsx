export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import PerformanceReviewManager from "@/components/rh/PerformanceReviewManager";
import { Badge } from "@/components/ui/badge";
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
  synthese_ia?: string | null;
  score?: number | null;
  potential_score?: number | null;
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
    synthese_ia: ev.synthese_ia ?? null,
    score: ev.score ?? null,
    potential_score: ev.potential_score ?? null,
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
    <div className="p-4 sm:p-8 md:p-12 space-y-12 max-w-[1600px] mx-auto">
      {/* Premium Hero Section */}
      <div className="relative group">
         <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-all duration-1000" />
         <div className="relative bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden">
            <div className="absolute right-0 top-0 w-1/3 h-full bg-slate-50/50 -skew-x-12 translate-x-1/2" />
            <div className="relative z-10 space-y-4">
               <div className="flex items-center gap-3">
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Business Intelligence</Badge>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] text-slate-600 font-black uppercase">Cycle Q2 2026</span>
               </div>
               <h1 className="text-5xl font-black text-slate-900 tracking-tightest leading-none">
                 Performance <br/>
                 <span className="text-primary italic">&</span> Évaluations
               </h1>
               <p className="text-sm text-slate-600 font-medium max-w-md leading-relaxed">
                 Analysez le potentiel de vos équipes à travers des indicateurs de performance objectifs et un suivi continu du capital humain.
               </p>
            </div>

            <div className="relative z-10 flex gap-6 sm:gap-12 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
               <div className="text-center group/kpi">
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-tighter mb-2 group-hover/kpi:text-primary transition-colors">Audit Prévus</p>
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">{evsCeTrimestre}</p>
                  <div className="h-1 w-8 bg-primary/20 mx-auto mt-4 rounded-full group-hover/kpi:w-12 transition-all" />
               </div>
               <div className="w-px h-16 bg-slate-200 mt-4" />
               <div className="text-center group/kpi">
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-tighter mb-2 group-hover/kpi:text-emerald-500 transition-colors">Score Moyen</p>
                  <p className="text-5xl font-black text-emerald-600 tracking-tighter">{scoreMoyen != null ? scoreMoyen : "—"}</p>
                  <div className="h-1 w-8 bg-emerald-500/20 mx-auto mt-4 rounded-full group-hover/kpi:w-12 transition-all" />
               </div>
               <div className="w-px h-16 bg-slate-200 mt-4" />
               <div className="text-center group/kpi">
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-tighter mb-2 group-hover/kpi:text-amber-500 transition-colors">En Attente</p>
                  <p className="text-5xl font-black text-amber-600 tracking-tighter">{enAttente}</p>
                  <div className="h-1 w-8 bg-amber-500/20 mx-auto mt-4 rounded-full group-hover/kpi:w-12 transition-all" />
               </div>
            </div>
         </div>
      </div>

      {/* Main Content */}
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[600px] bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
           <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary mx-auto" />
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Synchronisation des données...</p>
           </div>
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
