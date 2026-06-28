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
    <div className="p-4 sm:p-8 md:p-12 space-y-12 max-w-[1700px] mx-auto min-h-screen bg-[#fafbfc]">
      {/* Premium Hero Section - Refined Glassmorphism */}
      <div className="relative">
         {/* Decorative elements */}
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
         <div className="absolute top-1/2 -right-24 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-700" />
         
         <div className="relative bg-white/80 backdrop-blur-2xl border border-white p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden group">
            {/* Glossy overlay */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
            
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-4">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold text-[10px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-sm">
                    Intelligence RH v4.0
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cycle Actif : Q2 2026</span>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tightest leading-[0.9] flex flex-col">
                    <span className="opacity-40">ANALYTICS</span>
                    <span className="flex items-center gap-4">
                       Performance
                       <span className="h-2 w-2 rounded-full bg-primary mt-4" />
                    </span>
                  </h1>
               </div>
               
               <p className="text-sm md:text-base text-slate-500 font-medium max-w-md leading-relaxed border-l-2 border-slate-100 pl-6">
                 Pilotez le capital humain par la donnée. Visualisez les trajectoires de carrière et optimisez les plans de succession.
               </p>
            </div>

            <div className="relative z-10 w-full lg:w-auto">
               <div className="grid grid-cols-3 gap-1 md:gap-4 bg-slate-900/5 p-2 rounded-[2.5rem] border border-white/50 backdrop-blur-sm">
                  {[
                    { label: 'Audits', value: evsCeTrimestre, color: 'text-primary' },
                    { label: 'Score', value: scoreMoyen != null ? scoreMoyen : "—", color: 'text-emerald-500' },
                    { label: 'Pending', value: enAttente, color: 'text-amber-500' }
                  ].map((kpi, idx) => (
                    <div key={idx} className="bg-white/90 p-6 md:p-8 rounded-[2rem] shadow-[0_8px_16px_rgba(0,0,0,0.02)] border border-white min-w-[120px] md:min-w-[160px] text-center hover:scale-[1.02] transition-all duration-500 group/item">
                       <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-3 group-hover/item:text-slate-900 transition-colors uppercase">{kpi.label}</p>
                       <p className={`text-4xl md:text-6xl font-bold ${kpi.color} tracking-tightest`}>{kpi.value}</p>
                       <div className="flex justify-center mt-4">
                         <div className="h-1 w-6 bg-slate-100 rounded-full group-hover/item:w-10 group-hover/item:bg-primary transition-all duration-500" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>


      {/* Main Content */}
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[600px] bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
           <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary mx-auto" />
              <p className="text-[10px] font-bold uppercase text-slate-300 tracking-[0.3em]">Synchronisation des données...</p>
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
