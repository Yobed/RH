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
    border: "border-slate-200/80 hover:border-[#FF8200]/40 dark:border-slate-800",
    value: "text-slate-900 dark:text-slate-50",
    iconBox: "bg-slate-100 text-slate-600 group-hover:bg-[#FF8200]/10 group-hover:text-[#FF8200] dark:bg-slate-800 dark:text-slate-300",
  },
  warning: {
    border: "border-amber-200/80 hover:border-amber-400 dark:border-amber-900/40",
    value: "text-amber-950 dark:text-amber-100",
    iconBox: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
  },
  danger: {
    border: "border-rose-200/80 hover:border-rose-400 dark:border-rose-900/40",
    value: "text-rose-950 dark:text-rose-100",
    iconBox: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400",
  },
  success: {
    border: "border-emerald-200/80 hover:border-emerald-400 dark:border-emerald-900/40",
    value: "text-emerald-950 dark:text-emerald-100",
    iconBox: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90",
        "border transition-all duration-300",
        cfg.border,
        "shadow-lg shadow-slate-100/60 hover:shadow-xl hover:-translate-y-0.5 dark:shadow-none",
        featured ? "p-7 sm:p-8 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:to-slate-850" : "p-5 sm:p-6"
      )}
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
            {label}
          </p>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-250 group-hover:scale-110 shadow-xs", cfg.iconBox)}>
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
            <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 leading-normal mt-2">
              {description}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
