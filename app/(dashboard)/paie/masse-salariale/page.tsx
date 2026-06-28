"use client";

import { createClientSupabase } from "@/lib/supabase/client";
import { PageHelp } from "@/components/rh/PageHelp";
import { MasseSalarialeDashboard } from "@/components/paie/MasseSalarialeDashboard";
import Link from "next/link";
import { 
  CaretLeft, 
  CalendarBlank, 
  Funnel, 
  Info,
  Scales,
  Clock,
  Layout
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MasseSalarialePage() {
  const supabase = createClientSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const periodeParam = searchParams.get("periode");
  const currentPeriode = new Date().toISOString().slice(0, 7);
  const periode = periodeParam ?? currentPeriode;

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const { data } = await supabase
        .from("bulletins_paie")
        .select(
          `id, periode, salaire_brut, cnps_salarie, its, salaire_net, statut,
           sursalaire, prime_anciennete, prime_exceptionnelle, prime_salissure,
           prime_depassement, prime_fonction, prime_transport,
           total_contributions, net_to_pay, tax_cn, tax_igr, withholding_cnps,
           employees(full_name, poste, matricule)`
        )
        .eq("periode", periode)
        .order("created_at", { ascending: false });

      const bulletinsData = (data ?? []).map((b: any) => ({
        ...b,
        employees: Array.isArray(b.employees) ? b.employees[0] ?? null : b.employees,
      }));
      
      setBulletins(bulletinsData);
      setIsLoading(false);
    }
    fetchData();
  }, [periode, supabase]);

  const moisDisponibles: string[] = [];
  for (let i = 0; i < 18; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    moisDisponibles.push(d.toISOString().slice(0, 7));
  }

  const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const p = formData.get("periode") as string;
    router.push(`/paie/masse-salariale?periode=${p}`);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <div className="p-8 space-y-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/60">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Link
              href="/paie"
              className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">
                <CaretLeft size={14} weight="bold" />
              </div>
              RETOUR À LA PAIE
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20">
                  <Layout size={24} weight="duotone" className="text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Masse Salariale</h1>
                  <PageHelp text="L'analyse du coût total de votre personnel : répartition par département, évolution dans le temps et projection de la masse salariale." />
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-3 font-medium max-w-md">
                Analyse consolidée des coûts salariaux globaux et conformité légale CNPS Côte d'Ivoire 2026.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="shrink-0"
          >
            <form onSubmit={handleFilter} className="flex items-center gap-3 p-2 bg-white rounded-3xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                  <CalendarBlank size={18} weight="duotone" className="text-slate-400" />
                  <select
                    id="periode"
                    name="periode"
                    defaultValue={periode}
                    className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {moisDisponibles.map((m) => (
                      <option key={m} value={m}>
                        {new Date(m + "-01").toLocaleDateString("fr-CI", { month: "long", year: "numeric" })}
                      </option>
                    ))}
                  </select>
               </div>
               <button
                type="submit"
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
              >
                <Funnel size={14} weight="bold" />
                FILTRER
              </button>
            </form>
          </motion.div>
        </div>

        {/* Legal Reference HUD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white p-1 shadow-2xl shadow-slate-200/40"
        >
          <div className="flex flex-col lg:flex-row lg:items-center">
            <div className="flex items-center gap-4 bg-slate-900 p-6 lg:rounded-l-[2.3rem] lg:min-w-[280px]">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <Scales size={24} weight="duotone" className="text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Rappel Légal</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Barèmes CNPS CI 2026</p>
              </div>
            </div>
            
            <div className="flex-grow p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
              {[
                { label: "Retraite Pat.", value: "7,7%", sub: "Plafond: 1,6M" },
                { label: "Prest. Fam.", value: "5%", sub: "Plafond: 70k" },
                { label: "Acc. Mat.", value: "0,75%", sub: "Forfaitaire" },
                { label: "AT / MP", value: "3%", sub: "Taux Moyen" },
                { label: "FDFP / CMU", value: "1%", sub: "1600 FCFA/Sal." },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-slate-900">{item.value}</span>
                    <span className="text-[10px] font-bold text-slate-400">{item.sub}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-slate-50 border-l border-slate-100 flex items-center justify-center">
               <Info size={20} weight="duotone" className="text-slate-300 hover:text-slate-900 transition-colors cursor-help" />
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="relative pt-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 space-y-6"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-center">
                   <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Calcul des indicateurs</p>
                   <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-tight">Veuillez patienter...</p>
                </div>
              </motion.div>
            ) : bulletins.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[3rem] border-2 border-dashed border-slate-200 p-24 text-center bg-white shadow-xl shadow-slate-100/50"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                   <Clock size={40} weight="duotone" className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Aucun bulletin identifié</h3>
                <p className="mt-3 text-sm text-slate-500 font-medium max-w-xs mx-auto">
                  Nous n'avons trouvé aucun bulletin de paie généré pour la période <span className="text-slate-900 font-bold">{periode}</span>.
                </p>
                <div className="mt-10 flex gap-4 justify-center">
                  <Link href="/paie" className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-lg shadow-slate-900/10 hover:translate-y-[-2px] transition-all">
                     GÉNÉRER DES BULLETINS
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <MasseSalarialeDashboard bulletins={bulletins} periode={periode} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
