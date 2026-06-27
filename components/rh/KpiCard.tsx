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
    border: "border-slate-200/90 dark:border-slate-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/40",
    dot: "bg-[#E06D00] dark:bg-[#F58220]",
    value: "text-slate-900 dark:text-slate-50",
    iconWrap: "bg-amber-500/10 text-[#E06D00] dark:bg-amber-500/15 dark:text-[#F58220]",
  },
  warning: {
    border: "border-amber-200 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-700",
    dot: "bg-amber-500",
    value: "text-amber-950 dark:text-amber-200",
    iconWrap: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  danger: {
    border: "border-red-200 dark:border-red-900/50 hover:border-red-400 dark:hover:border-red-700",
    dot: "bg-rose-500",
    value: "text-rose-950 dark:text-rose-200",
    iconWrap: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  },
  success: {
    border: "border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-700",
    dot: "bg-emerald-500",
    value: "text-emerald-950 dark:text-emerald-200",
    iconWrap: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
};

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-white dark:bg-slate-900/90",
        "border",
        cfg.border,
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] transition-all duration-250",
        featured ? "p-7 sm:p-8" : "p-5 sm:p-6"
      )}
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 animate-pulse", cfg.dot)} />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              {label}
            </p>
          </div>
          <div className={cn("rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-110", featured ? "p-3" : "p-2.5", cfg.iconWrap)}>
            <Icon weight="duotone" className={featured ? "h-6 w-6" : "h-5 w-5"} />
          </div>
        </div>

        {/* Value */}
        <div className="flex flex-col gap-1.5">
          {isNumber ? (
            <span
              className={cn(
                "font-extrabold tracking-tight tabular-nums leading-none",
                featured ? "text-5xl sm:text-6xl" : "text-3xl sm:text-[2.5rem]",
                cfg.value
              )}
            >
              <AnimatedNumber value={value as number} className="contents" />
            </span>
          ) : (
            <span
              className={cn(
                "font-extrabold tracking-tight tabular-nums leading-none",
                featured ? "text-5xl sm:text-6xl" : "text-3xl sm:text-[2.5rem]",
                cfg.value
              )}
            >
              {value}
            </span>
          )}
          {description && (
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-normal mt-2">
              {description}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

