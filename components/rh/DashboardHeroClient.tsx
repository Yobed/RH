"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  totalActifs: number;
  complianceScore: number;
  congesEnAttente: number;
  dateLabel: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.75, ease } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.60, ease } },
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
    <div className="relative h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-[#FF8200]"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
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
      className="relative"
    >
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        {/* Left — heading block */}
        <div className="space-y-2">
          <motion.p
            variants={fadeUp}
            className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-400"
          >
            {dateLabel}
          </motion.p>

          <motion.div variants={fadeUp} className="space-y-1">
            <p className="text-sm font-bold tracking-wide text-[#FF8200]">
              {greeting}
            </p>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              Tableau de bord{" "}
              <span className="text-[#FF8200]">
                RH
              </span>
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Gestion du capital humain · Législation & Droit ivoirien
            </p>
          </motion.div>

          {/* Inline live stats row */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            {[
              {
                label: "collaborateurs actifs",
                value: totalActifs,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white dark:border-slate-800/80 dark:bg-slate-900/90 px-3.5 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <span className="text-xs font-bold tabular-nums text-slate-800 dark:text-slate-200">
                  {stat.value}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — compliance card */}
        <motion.div
          variants={scaleIn}
          className="shrink-0 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm min-w-[220px]"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 text-center">
            Score conformité
          </p>

          {/* Ring */}
          <div className="relative flex items-center justify-center mb-3">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="6"
                className="dark:stroke-slate-800"
              />
              <motion.circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="#FF8200"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 34 * (1 - complianceScore / 100),
                }}
                transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {complianceScore}
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-medium">/ 100</span>
            </div>
          </div>

          <AnimatedBar value={complianceScore} delay={0.4} />
          <p className="mt-2.5 text-xs font-bold text-center text-slate-700 dark:text-slate-300">
            {complianceScore >= 85
              ? "Excellent"
              : complianceScore >= 70
              ? "Satisfaisant"
              : "À améliorer"}
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
