"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles, ArrowUpRight, ShieldCheck, Clock, CheckCircle } from "lucide-react";

interface Props {
  totalActifs: number;
  complianceScore: number;
  congesEnAttente: number;
  dateLabel: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease } },
};

function useGreeting() {
  const [greeting, setGreeting] = useState("Bonjour");
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Bonjour");
    else if (h < 18) setGreeting("Bon après-midi");
    else setGreeting("Bonsoir");
  }, []);
  return greeting;
}

function AnimatedBar({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <div className="relative h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden p-0.5 shadow-inner">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#017E84]"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export function DashboardHeroClient({ totalActifs, complianceScore, congesEnAttente, dateLabel }: Props) {
  const greeting = useGreeting();

  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-7 sm:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all duration-300"
    >
      {/* Odoo Signature Tri-Color Studio Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#017E84]" />

      {/* Dynamic ambient background glowing aura */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#1e40af]/10 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 -left-24 h-80 w-80 rounded-full bg-[#2563eb]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-1/3 h-72 w-72 rounded-full bg-[#017E84]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 sm:gap-10">
        
        {/* Left Header Box */}
        <div className="space-y-5 max-w-3xl">
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#1e40af]/10 text-[#1e40af] dark:bg-[#1e40af]/20 dark:text-[#A87B9F] border border-[#1e40af]/20 shadow-xs backdrop-blur-md">
              <Clock className="h-3.5 w-3.5 text-[#1e40af]" />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#2563eb]/15 text-[#2563eb] border border-[#2563eb]/30 shadow-xs backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563eb] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563eb]" />
              </span>
              Odoo 18 Studio Cockpit
            </span>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-2">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              {greeting}, <span className="bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#017E84] bg-clip-text text-transparent">Direction RH</span>
            </h1>
            <p className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Supervisez le capital humain, automatisez les processus juridiques et garantissez la conformité au Code du Travail Ivoirien.
            </p>
          </motion.div>

          {/* Interactive Live Status Chips */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3.5 pt-1">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/90 px-4.5 py-2.5 shadow-sm backdrop-blur-md hover:border-[#1e40af]/50 transition-all group cursor-pointer">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#017E84] animate-pulse" />
              <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white group-hover:text-[#017E84] transition-colors">{totalActifs}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Salariés Actifs</span>
            </div>

            {congesEnAttente > 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-300/80 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/50 px-4.5 py-2.5 shadow-sm backdrop-blur-md hover:border-[#2563eb] transition-all group cursor-pointer">
                <span className="text-sm font-bold tabular-nums text-[#2563eb]">{congesEnAttente}</span>
                <span className="text-xs text-amber-950 dark:text-amber-300 font-bold">Demande(s) de Congé</span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#2563eb] text-[10px] font-bold text-white uppercase tracking-wider ml-1">À valider</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 px-4 py-2.5 shadow-xs">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Congés à jour</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Compliance Telemetry Center */}
        <motion.div
          variants={fadeUp}
          className="shrink-0 rounded-[2rem] border border-slate-200/90 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-900/90 p-7 shadow-xl shadow-slate-200/60 dark:shadow-none min-w-[280px] text-center relative overflow-hidden group hover:border-[#2563eb]/50 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb]/5 via-transparent to-[#1e40af]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#2563eb]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Score Conformité Légale
              </span>
            </div>
            <span className="h-2 w-2 rounded-full bg-[#017E84] animate-ping" />
          </div>

          {/* Interactive Telemetry Ring */}
          <div className="relative flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
            <svg className="h-28 w-28 -rotate-90 filter drop-shadow-md" viewBox="0 0 80 80">
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="7"
                className="dark:stroke-slate-800"
              />
              <motion.circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="url(#complianceGradientOdoo)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 34 * (1 - complianceScore / 100),
                }}
                transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
              <defs>
                <linearGradient id="complianceGradientOdoo" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e40af" />
                  <stop offset="50%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#017E84" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {complianceScore}
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">/ 100 PTS</span>
            </div>
          </div>

          <AnimatedBar value={complianceScore} delay={0.4} />

          <div className="mt-4 flex items-center justify-between pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e40af]/10 text-[#1e40af] dark:bg-[#1e40af]/20 dark:text-[#A87B9F] text-[11px] font-extrabold shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
              {complianceScore >= 85
                ? "Optimal"
                : complianceScore >= 70
                ? "Satisfaisant"
                : "Avis requis"}
            </span>

            <button className="text-[11px] font-bold text-slate-400 group-hover:text-[#2563eb] flex items-center gap-0.5 transition-colors">
              Rapport <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>

      </div>
    </motion.section>
  );
}
