import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OvertimeManager } from "@/components/rh/OvertimeManager";
import PerformanceReviewManager from "@/components/rh/PerformanceReviewManager";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import { Clock } from "lucide-react";

export const metadata = { title: "Heures Supplémentaires — RH Manager CI" };

export default async function HeuresSupPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) redirect("/onboarding");

  const [{ data: employees }, { data: records }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, salaire_brut")
      .eq("company_id", profile.company_id)
      .eq("statut", "actif")
      .order("full_name"),
    supabase
      .from("overtime_records")
      .select("*, employee:employees(full_name, matricule)")
      .eq("company_id", profile.company_id)
      .order("date", { ascending: false })
      .limit(50),
  ]);

  // Calculs rapides pour la Hero
  const totalHeuresMois = (records || []).reduce((acc, r) => {
    const isCurrentMonth = new Date(r.date).getMonth() === new Date().getMonth();
    return acc + (isCurrentMonth ? (r.hours_count || 0) : 0);
  }, 0);

  const totalPersonnel = new Set((records || []).map(r => r.employee_id)).size;

  return (
    <div className="p-4 sm:p-8 md:p-12 space-y-12 max-w-[1600px] mx-auto">
      {/* Premium Hero Section */}
      <div className="relative group">
         <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-all duration-1000" />
         <div className="relative bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden">
            <div className="absolute right-0 top-0 w-1/3 h-full bg-slate-50/50 -skew-x-12 translate-x-1/2" />
            <div className="relative z-10 space-y-4">
               <div className="flex items-center gap-3">
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Gestion de la Paie</Badge>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] text-slate-600 font-black uppercase">Conformité Art. 24</span>
               </div>
               <h1 className="text-5xl font-black text-slate-900 tracking-tightest leading-none">
                 Heures <br/>
                 <span className="text-primary italic">&</span> Extras
               </h1>
               <p className="text-sm text-slate-600 font-medium max-w-md leading-relaxed">
                 Automatisez le calcul des majorations légales (15%, 50%, 75%, 100%) et simplifiez votre clôture mensuelle.
               </p>
            </div>

            <div className="relative z-10 flex gap-6 sm:gap-12 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
               <div className="text-center group/kpi">
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-tighter mb-2 group-hover/kpi:text-primary transition-colors">Heures (Mois)</p>
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">{totalHeuresMois}h</p>
                  <div className="h-1 w-8 bg-primary/20 mx-auto mt-4 rounded-full group-hover/kpi:w-12 transition-all" />
               </div>
               <div className="w-px h-16 bg-slate-200 mt-4" />
               <div className="text-center group/kpi">
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-tighter mb-2 group-hover/kpi:text-emerald-500 transition-colors">Individus</p>
                  <p className="text-5xl font-black text-emerald-600 tracking-tighter">{totalPersonnel}</p>
                  <div className="h-1 w-8 bg-emerald-500/20 mx-auto mt-4 rounded-full group-hover/kpi:w-12 transition-all" />
               </div>
            </div>
         </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px] bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
           <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary mx-auto" />
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Chargement des données...</p>
           </div>
        </div>
      }>
        <OvertimeManager
          employees={employees || []}
          initialRecords={records || []}
          companyId={profile.company_id}
        />
      </Suspense>
    </div>
  );
}
