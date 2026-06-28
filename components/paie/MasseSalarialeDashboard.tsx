"use client";

import { calculerChargesPatronales } from "@/lib/paie-ci";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { 
  Money, 
  Calculator, 
  Briefcase, 
  Bank, 
  ShieldCheck,
  TrendUp,
  User,
  CurrencyCircleDollar,
  ChartBar,
  HardHat,
  ArrowsClockwise
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(n);

interface BulletinRow {
  id: string;
  periode: string;
  salaire_brut: number;
  cnps_salarie: number;
  its: number;
  salaire_net: number;
  sursalaire: number | null;
  prime_anciennete: number | null;
  prime_exceptionnelle: number | null;
  prime_salissure: number | null;
  prime_depassement: number | null;
  prime_fonction: number | null;
  prime_transport: number | null;
  statut: string | null;
  employees: { full_name: string; poste: string; matricule: string } | null;
}

interface StatCardProps {
  label: string;
  value: number;
  sublabel: string;
  colorTheme: "emerald" | "rose" | "amber" | "violet" | "slate" | "sky" | "blue";
  icon: React.ReactNode;
  delay?: number;
}

function StatCard({ label, value, sublabel, colorTheme, icon, delay = 0 }: StatCardProps) {
  const themes = {
    emerald: {
      flat: "bg-emerald-50 text-emerald-600 border-emerald-100",
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      icon: "bg-emerald-500 text-white shadow-emerald-200",
      accent: "bg-emerald-500"
    },
    rose: {
      flat: "bg-rose-50 text-rose-600 border-rose-100",
      gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
      icon: "bg-rose-500 text-white shadow-rose-200",
      accent: "bg-rose-500"
    },
    amber: {
      flat: "bg-amber-50 text-amber-600 border-amber-100",
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      icon: "bg-amber-500 text-white shadow-amber-200",
      accent: "bg-amber-500"
    },
    violet: {
      flat: "bg-violet-50 text-violet-600 border-violet-100",
      gradient: "from-violet-500/10 via-violet-500/5 to-transparent",
      icon: "bg-violet-500 text-white shadow-violet-200",
      accent: "bg-violet-500"
    },
    slate: {
      flat: "bg-slate-50 text-slate-600 border-slate-100",
      gradient: "from-slate-500/10 via-slate-500/5 to-transparent",
      icon: "bg-slate-900 text-white shadow-slate-200",
      accent: "bg-slate-900"
    },
    sky: {
      flat: "bg-sky-50 text-sky-600 border-sky-100",
      gradient: "from-sky-500/10 via-sky-500/5 to-transparent",
      icon: "bg-sky-500 text-white shadow-sky-200",
      accent: "bg-sky-500"
    },
    blue: {
      flat: "bg-blue-50 text-blue-600 border-blue-100",
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      icon: "bg-blue-500 text-white shadow-blue-200",
      accent: "bg-blue-500"
    },
  };

  const theme = themes[colorTheme] || themes.slate;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
      }}
      className={cn(
        "group relative overflow-hidden rounded-[2.5rem] border bg-white p-7 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1",
        theme.flat
      )}
    >
      {/* Background Gradient Layer */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", theme.gradient)} />
      
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div className={cn("p-3.5 rounded-2xl shadow-lg shadow-current/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", theme.icon)}>
            {icon}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-500 transition-colors">
              {label}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-3xl font-bold tracking-tight text-slate-900 group-hover:scale-[1.02] origin-left transition-transform duration-500 tabular-nums">
            {fmt(value)}
          </h3>
          <div className="flex items-center gap-2">
            <div className={cn("h-1 w-1 rounded-full", theme.accent)} />
            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              {sublabel}
            </p>
          </div>
        </div>
      </div>

      {/* Decorative pulse element */}
      <div className="absolute -bottom-1 -right-1 w-24 h-24 bg-slate-900/5 rounded-full blur-2xl group-hover:bg-slate-900/10 transition-colors duration-500" />
    </motion.div>
  );
}

interface MasseSalarialeDashboardProps {
  bulletins: BulletinRow[];
  periode: string;
  tauxAtMp?: number;
}

export function MasseSalarialeDashboard({
  bulletins,
  periode,
  tauxAtMp = 0.03,
}: MasseSalarialeDashboardProps) {
  const totalBrut = bulletins.reduce((s, b) => s + Number(b.salaire_brut), 0);
  const totalNet = bulletins.reduce((s, b) => s + Number(b.salaire_net), 0);

  let totalChargesPatronales = 0;
  for (const b of bulletins) {
    const charges = calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp);
    totalChargesPatronales += charges.total;
  }

  const coutTotalEmployeur = totalBrut + totalChargesPatronales;
  const totalRetenuesSalariales = bulletins.reduce(
    (s, b) => s + Number(b.cnps_salarie) + Number(b.its),
    0
  );

  const nbBulletins = bulletins.length;
  const nbPaies = bulletins.filter((b) => b.statut === "payé").length;

  const dataDonut = [
    { name: "Net Salarié", value: totalNet, color: "#0f172a" },
    { name: "Retenues Salariales", value: totalRetenuesSalariales, color: "#f43f5e" },
    { name: "Charges Patronales", value: totalChargesPatronales, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* KPI Grid with Staggered Entrance */}
      <motion.div 
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="visible"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard
          label="Total Salaire Brut"
          value={totalBrut}
          sublabel={`${nbBulletins} bulletin(s) identifié(s)`}
          colorTheme="slate"
          icon={<Calculator size={24} weight="duotone" />}
        />
        <StatCard
          label="Net à payer total"
          value={totalNet}
          sublabel={`${nbPaies} règlements effectués`}
          colorTheme="emerald"
          icon={<Money size={24} weight="duotone" />}
        />
        <StatCard
          label="Charges patronales"
          value={totalChargesPatronales}
          sublabel="Base CNPS & FDFP Côte d'Ivoire"
          colorTheme="amber"
          icon={<Bank size={24} weight="duotone" />}
        />
        <StatCard
          label="Retenues salariales"
          value={totalRetenuesSalariales}
          sublabel="ITS & Part salariale CNPS"
          colorTheme="rose"
          icon={<ShieldCheck size={24} weight="duotone" />}
        />
        <StatCard
          label="Coût Global Employeur"
          value={coutTotalEmployeur}
          sublabel="Charges + Brut (Masse Salariale)"
          colorTheme="violet"
          icon={<TrendUp size={24} weight="duotone" />}
        />
        
        <motion.div
           variants={{
             hidden: { opacity: 0, scale: 0.9, y: 20 },
             visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
           }}
           className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white flex flex-col justify-between shadow-2xl transition-all duration-500 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <CurrencyCircleDollar size={20} weight="duotone" className="text-indigo-400" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Coût moyen / salarié
              </p>
            </div>
            
            <div className="mt-2">
              <h3 className="text-4xl font-bold tracking-tight tabular-nums group-hover:translate-x-1 transition-transform duration-500">
                {nbBulletins > 0 ? fmt(Math.round(coutTotalEmployeur / nbBulletins)) : "—"}
              </h3>
              <p className="text-xs text-slate-500 mt-3 font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                Index de performance budgétaire 2026
              </p>
            </div>
          </div>
          
          <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
            <User size={160} weight="duotone" className="text-white" />
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Structure Chart Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="rounded-[3rem] bg-white border border-slate-200/60 shadow-xl shadow-slate-200/20 p-10 flex flex-col items-center group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <ChartBar size={120} weight="duotone" />
          </div>

          <div className="flex items-center gap-3 mb-10 w-full justify-start relative z-10">
            <div className="p-2.5 bg-slate-100 rounded-2xl">
              <TrendUp size={20} weight="duotone" className="text-slate-900" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-slate-900 tracking-tight">Structure budgétaire</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ventilation des flux</p>
            </div>
          </div>
          
          <div className="h-64 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={100}
                  paddingAngle={10}
                  dataKey="value"
                  strokeWidth={0}
                  animationBegin={500}
                  animationDuration={1500}
                >
                  {dataDonut.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => fmt(value)} 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                    padding: '16px 20px',
                    fontSize: '13px',
                    fontWeight: '900',
                    background: 'rgba(15, 23, 42, 0.95)',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-transform group-hover:scale-110 duration-500">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Flux</p>
                <p className="text-3xl font-bold text-slate-900 leading-none mt-1.5">100<span className="text-sm">%</span></p>
            </div>
          </div>

          <div className="w-full space-y-3 mt-8 relative z-10">
            {dataDonut.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100/50 transition-all duration-300 hover:bg-slate-100/80 hover:translate-x-1">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 4px 12px ${item.color}40` }} />
                  <span className="text-xs font-bold text-slate-700 tracking-tight">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 tabular-nums">{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contribution Details Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="lg:col-span-2 rounded-[3rem] bg-slate-900 text-white p-10 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,#312e81,transparent)] opacity-40 mix-blend-overlay pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-white/10 rounded-[1.5rem] backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20 group-hover:rotate-12 transition-transform duration-500">
                <Bank size={28} weight="duotone" className="text-amber-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Analyse des charges patronales</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Conformité CNPS Côte d'Ivoire 2026
                </p>
              </div>
            </div>
            <div className="hidden sm:flex px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 backdrop-blur-md">
               Période {periode}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {[
              { label: "Retraite patronale (7,7%)", val: bulletins.reduce((s, b) => s + calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp).retraite, 0), icon: <ShieldCheck weight="duotone" className="text-blue-400" />, bg: "bg-blue-400/10" },
              { label: "Prestations familiales (5%)", val: bulletins.reduce((s, b) => s + calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp).familiales, 0), icon: <User weight="duotone" className="text-purple-400" />, bg: "bg-purple-400/10" },
              { label: "Accidents maternité (0,75%)", val: bulletins.reduce((s, b) => s + calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp).maternite, 0), icon: <ChartBar weight="duotone" className="text-emerald-400" />, bg: "bg-emerald-400/10" },
              { label: "AT / MP (Suivant risques)", val: bulletins.reduce((s, b) => s + calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp).at_mp, 0), icon: <HardHat weight="duotone" className="text-rose-400" />, bg: "bg-rose-400/10" },
              { label: "Taxe FDFP (1%)", val: bulletins.reduce((s, b) => s + calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp).fdfp, 0), icon: <Briefcase weight="duotone" className="text-cyan-400" />, bg: "bg-cyan-400/10" },
              { label: "CMU patronale (Forfait)", val: nbBulletins * 1600, icon: <CurrencyCircleDollar weight="duotone" className="text-amber-400" />, bg: "bg-amber-400/10" },
            ].map((charge, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + (idx * 0.05) }}
                className="group/item flex flex-col p-6 rounded-[2rem] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 backdrop-blur-sm cursor-default"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={cn("p-2.5 rounded-xl transition-transform group-hover/item:rotate-12 duration-500", charge.bg)}>
                    {charge.icon}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1.5 transition-colors group-hover/item:text-slate-400">
                  {charge.label}
                </span>
                <span className="text-2xl font-bold tracking-tighter tabular-nums text-white group-hover/item:scale-105 origin-left transition-transform duration-500">
                  {fmt(charge.val)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-2 h-7 bg-slate-900 rounded-full" />
               <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">Coûts par Collaborateur</h3>
            </div>
            <p className="text-sm text-slate-500 font-bold ml-5 uppercase tracking-widest opacity-60">Listing détaillé de la période</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/80 rounded-2xl border border-slate-200/50 backdrop-blur-sm group transition-all hover:bg-slate-900 hover:text-white">
             <User size={16} weight="duotone" className="group-hover:text-indigo-400 transition-colors" />
             <span className="text-xs font-bold uppercase tracking-widest tabular-nums">
               {nbBulletins} Effectifs totaux
             </span>
          </div>
        </div>

        <div className="rounded-[3rem] bg-white border border-slate-200/60 shadow-2xl shadow-slate-200/40 overflow-hidden relative group/table">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
                  <th className="px-10 py-7 text-left font-bold uppercase tracking-[0.2em] text-[10px]">Collaborateur</th>
                  <th className="px-6 py-7 text-right font-bold uppercase tracking-[0.2em] text-[10px] hidden md:table-cell">Brut de Base</th>
                  <th className="px-6 py-7 text-right font-bold uppercase tracking-[0.2em] text-[10px] hidden lg:table-cell">Patronale (+%)</th>
                  <th className="px-6 py-7 text-right font-bold uppercase tracking-[0.2em] text-[10px]">Coût Entreprise</th>
                  <th className="px-10 py-7 text-right font-bold uppercase tracking-[0.2em] text-[10px] hidden md:table-cell">Net Salarié</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {bulletins.map((b, idx) => {
                    const charges = calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp);
                    const coutTotal = Number(b.salaire_brut) + charges.total;
                    return (
                      <motion.tr 
                        key={b.id || idx} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + (idx * 0.05) }}
                        className="group hover:bg-slate-50/50 transition-all duration-300"
                      >
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-5">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:rotate-[10deg] transition-all duration-500 relative z-10 shadow-sm">
                                 <User size={22} weight="duotone" />
                              </div>
                              <div className="absolute -inset-1 bg-slate-900/5 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 text-base tracking-tight">{b.employees?.full_name ?? "Collaborateur Externe"}</p>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                  {b.employees?.matricule ?? "N/A"}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                   <Briefcase size={12} weight="fill" className="text-slate-300" /> {b.employees?.poste ?? "Poste indéfini"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-7 text-right font-bold text-slate-500 tabular-nums hidden md:table-cell">
                          {fmt(Number(b.salaire_brut))}
                        </td>
                        <td className="px-6 py-7 text-right hidden lg:table-cell tabular-nums">
                          <div className="flex flex-col items-end gap-1">
                             <span className="px-3 py-1 bg-amber-50 rounded-full text-[10px] font-bold text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                                + {fmt(charges.total)}
                             </span>
                             <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Incidence Digitale</span>
                          </div>
                        </td>
                        <td className="px-6 py-7 text-right">
                          <span className="font-bold text-slate-900 text-lg tracking-tight tabular-nums group-hover:text-indigo-600 transition-colors">
                            {fmt(coutTotal)}
                          </span>
                        </td>
                        <td className="px-10 py-7 text-right hidden md:table-cell">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-emerald-600/80 text-lg tabular-nums transition-all group-hover:text-emerald-600 group-hover:scale-105 origin-right">
                              {fmt(Number(b.salaire_net))}
                            </span>
                            <div className="w-12 h-1 bg-emerald-500/10 rounded-full mt-1 group-hover:w-20 group-hover:bg-emerald-500/20 transition-all duration-700" />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
              <tfoot className="relative border-t-2 border-slate-900 group-hover/table:translate-y-1 transition-transform duration-500">
                <tr className="bg-slate-900 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-transparent to-transparent pointer-events-none" />
                  
                  <td className="px-10 py-10 rounded-bl-[3rem] relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-1">Résumé Global</p>
                    <p className="font-bold text-xl tracking-tight">Consommation Période</p>
                  </td>
                  <td className="px-6 py-10 text-right font-bold text-slate-500 hidden md:table-cell text-xl tabular-nums relative z-10">
                    {fmt(totalBrut)}
                  </td>
                  <td className="px-6 py-10 text-right font-bold text-amber-500 hidden lg:table-cell text-xl tabular-nums relative z-10">
                     {fmt(totalChargesPatronales)}
                  </td>
                  <td className="px-6 py-10 text-right relative z-10">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-3xl tracking-tighter text-white tabular-nums drop-shadow-lg drop-shadow-indigo-500/20">
                        {fmt(coutTotalEmployeur)}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Coût Total Entreprise</span>
                    </div>
                  </td>
                  <td className="px-10 py-10 text-right rounded-br-[3rem] relative z-10 hidden md:table-cell">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-3xl tracking-tighter text-emerald-400 tabular-nums">
                        {fmt(totalNet)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Net Versé Salariés</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
