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

export function DashboardHeroClient({ totalActifs, complianceScore, congesEnAttente, dateLabel }: Props) {
  const greeting = useGreeting();

  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      animate="show"
      className="pro-card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden"
    >
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Header Box */}
        <div className="space-y-4 max-w-2xl">
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Espace Direction RH
            </span>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-1.5">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {greeting}, <span className="text-emerald-600 dark:text-emerald-400">Direction RH</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Supervisez le capital humain, automatisez les processus juridiques et garantissez la conformité au Code du Travail Ivoirien.
            </p>
          </motion.div>

          {/* Interactive Live Status Chips */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-3.5 py-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{totalActifs}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">Salariés Actifs</span>
            </div>

            {congesEnAttente > 0 ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 px-3.5 py-2">
                <span className="text-sm font-bold tabular-nums text-amber-700 dark:text-amber-400">{congesEnAttente}</span>
                <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">Demande(s) de Congé</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-600 text-[10px] font-semibold text-white uppercase ml-1">À traiter</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 px-3.5 py-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Congés à jour</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Center 3D Team Illustration */}
        <motion.div variants={fadeUp} className="hidden xl:flex shrink-0 w-52 justify-center items-center">
          <img
            src="/images/hr_team_hero.png"
            alt="HR Team Illustration"
            className="w-full h-auto object-contain drop-shadow-md"
          />
        </motion.div>

        {/* Right Compliance Telemetry Center */}
        <motion.div
          variants={fadeUp}
          className="shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-5 min-w-[240px] text-center relative"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Conformité Légale
              </span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {complianceScore}<span className="text-lg text-slate-400 font-normal">/100</span>
              </span>
              <span className="text-xs text-slate-500 font-medium mt-1">Score de conformité RH</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              {complianceScore >= 85
                ? "Conforme"
                : complianceScore >= 70
                ? "Satisfaisant"
                : "Avis requis"}
            </span>

            <button className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
              Rapport <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>

      </div>
    </motion.section>
  );
}
