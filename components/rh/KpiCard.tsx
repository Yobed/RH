"use client";

import { cn } from "@/lib/utils";
import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  variant?: "default" | "warning" | "danger" | "success";
  index?: number;
  featured?: boolean;
}

const variantConfig = {
  default: {
    border: "border-slate-100/80 dark:border-[oklch(0.22_0.035_248)]",
    glow: "hover:shadow-[0_20px_60px_-12px_oklch(0.32_0.14_252/0.18),0_4px_16px_-4px_oklch(0.32_0.14_252/0.10)]",
    dot: "bg-[oklch(0.32_0.14_252)]",
    value: "text-slate-900 dark:text-white",
    iconWrap: "bg-[oklch(0.94_0.016_252)] text-[oklch(0.32_0.14_252)] dark:bg-[oklch(0.22_0.04_252)] dark:text-[oklch(0.72_0.12_252)]",
    accent: "oklch(0.32 0.14 252)",
    accentLight: "oklch(0.55 0.16 280)",
  },
  warning: {
    border: "border-amber-100/80 dark:border-amber-900/40",
    glow: "hover:shadow-[0_20px_60px_-12px_oklch(0.78_0.13_73/0.22),0_4px_16px_-4px_oklch(0.78_0.13_73/0.12)]",
    dot: "bg-amber-500",
    value: "text-amber-700 dark:text-amber-300",
    iconWrap: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    accent: "oklch(0.78 0.13 73)",
    accentLight: "oklch(0.88 0.12 73)",
  },
  danger: {
    border: "border-red-100/80 dark:border-red-900/40",
    glow: "hover:shadow-[0_20px_60px_-12px_oklch(0.577_0.245_27/0.20),0_4px_16px_-4px_oklch(0.577_0.245_27/0.10)]",
    dot: "bg-red-500",
    value: "text-red-700 dark:text-red-300",
    iconWrap: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    accent: "oklch(0.577 0.245 27)",
    accentLight: "oklch(0.75 0.22 27)",
  },
  success: {
    border: "border-emerald-100/80 dark:border-emerald-900/40",
    glow: "hover:shadow-[0_20px_60px_-12px_oklch(0.55_0.18_155/0.20),0_4px_16px_-4px_oklch(0.55_0.18_155/0.10)]",
    dot: "bg-emerald-500",
    value: "text-emerald-700 dark:text-emerald-300",
    iconWrap: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    accent: "oklch(0.55 0.18 155)",
    accentLight: "oklch(0.72 0.16 155)",
  },
};

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.0,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toString();
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span ref={ref} className={className}>0</span>;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  description,
  variant = "default",
  index = 0,
  featured = false,
}: KpiCardProps) {
  const cfg = variantConfig[variant];
  const isNumber = typeof value === "number";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.075 }}
      whileHover={{
        y: -4,
        transition: { type: "spring", stiffness: 380, damping: 22 },
      }}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white dark:bg-[oklch(0.155_0.030_248)]",
        "border",
        cfg.border,
        "shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06),0_1px_3px_-1px_rgba(0,0,0,0.04)]",
        "transition-shadow duration-400",
        cfg.glow,
        featured ? "p-7" : "p-5"
      )}
    >
      {/* Grain texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Top gradient accent bar */}
      <motion.div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, ${cfg.accent} 0%, ${cfg.accentLight} 50%, transparent 100%)`,
        }}
      />

      {/* Soft ambient glow corner */}
      <div
        aria-hidden
        className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-[0.06] dark:opacity-[0.04] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.10]"
        style={{
          background: `radial-gradient(circle, ${cfg.accent} 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />

      <div className="relative">
        {/* Label row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 truncate">
              {label}
            </p>
          </div>
          <motion.div
            className={cn("rounded-xl p-2 shrink-0 transition-colors duration-300", cfg.iconWrap)}
            whileHover={{ scale: 1.1, rotate: 8 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Icon weight="duotone" className={featured ? "h-5 w-5" : "h-4 w-4"} />
          </motion.div>
        </div>

        {/* Value */}
        <div className="flex flex-col gap-1.5">
          {isNumber ? (
            <span
              className={cn(
                "font-bold tracking-tight tabular-nums leading-none",
                featured ? "text-5xl" : "text-[2.25rem]",
                cfg.value,
              )}
              style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
            >
              <AnimatedNumber value={value as number} className="contents" />
            </span>
          ) : (
            <span
              className={cn(
                "font-bold tracking-tight tabular-nums leading-none",
                featured ? "text-5xl" : "text-[2.25rem]",
                cfg.value
              )}
              style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
            >
              {value}
            </span>
          )}
          {description && (
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-snug">
              {description}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
