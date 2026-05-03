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
    <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: "linear-gradient(90deg, oklch(0.32 0.14 252), oklch(0.78 0.13 73))",
        }}
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
      {/* Ambient blob decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-16 h-64 w-64 rounded-full opacity-[0.12] dark:opacity-[0.08]"
        style={{
          background: "radial-gradient(circle, oklch(0.78 0.13 73) 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -left-8 h-48 w-48 rounded-full opacity-[0.08] dark:opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, oklch(0.55 0.18 252) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        {/* Left — heading block */}
        <div className="space-y-3">
          <motion.p
            variants={fadeUp}
            className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            {dateLabel}
          </motion.p>

          <motion.div variants={fadeUp} className="space-y-1">
            <p className="text-sm font-medium text-[oklch(0.78_0.13_73)]">
              {greeting}
            </p>
            <h1
              className="font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.08] tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
            >
              Tableau de bord{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, oklch(0.32 0.14 252) 0%, oklch(0.78 0.13 73) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                RH
              </span>
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              Capital humain — Côte d&apos;Ivoire · Droit ivoirien
            </p>
          </motion.div>

          {/* Inline live stats row */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center gap-3 pt-1"
          >
            {[
              {
                label: "actifs",
                value: totalActifs,
                color: "bg-emerald-500",
                textColor: "text-emerald-700 dark:text-emerald-400",
              },
              {
                label: "congés en attente",
                value: congesEnAttente,
                color: "bg-amber-400",
                textColor: "text-amber-700 dark:text-amber-400",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm"
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${stat.color}`} />
                <span className={`text-xs font-bold tabular-nums ${stat.textColor}`}>
                  {stat.value}
                </span>
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — compliance card */}
        <motion.div
          variants={scaleIn}
          className="shrink-0 rounded-2xl border border-border bg-card p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] glow-hover min-w-[220px]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-4">
            Score conformité
          </p>

          {/* Ring */}
          <div className="relative flex items-center justify-center mb-4">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="oklch(0.93 0.005 78)"
                strokeWidth="7"
                className="dark:stroke-[oklch(0.22_0.035_248)]"
              />
              <motion.circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 34 * (1 - complianceScore / 100),
                }}
                transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="oklch(0.32 0.14 252)" />
                  <stop offset="100%" stopColor="oklch(0.78 0.13 73)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-2xl font-bold tabular-nums"
                style={{
                  background: "linear-gradient(135deg, oklch(0.32 0.14 252), oklch(0.78 0.13 73))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontFamily: "var(--font-display, var(--font-sans))",
                }}
              >
                {complianceScore}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">/ 100</span>
            </div>
          </div>

          <AnimatedBar value={complianceScore} delay={0.4} />
          <p className="mt-2 text-[10px] text-center text-muted-foreground">
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
