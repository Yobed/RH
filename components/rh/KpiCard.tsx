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
    ribbon: "bg-[#FF8200]",
    iconBox: "bg-[#FF8200]/10 text-[#FF8200] group-hover:bg-[#FF8200] group-hover:text-white dark:bg-[#FF8200]/20 dark:text-[#FF8200]",
  },
  warning: {
    border: "border-amber-200/80 hover:border-[#FF8200]/50 dark:border-amber-900/40",
    value: "text-amber-950 dark:text-amber-100",
    ribbon: "bg-[#FF8200]",
    iconBox: "bg-[#FF8200]/10 text-[#FF8200] group-hover:bg-[#FF8200] group-hover:text-white dark:bg-[#FF8200]/20 dark:text-amber-400",
  },
  danger: {
    border: "border-rose-200/80 hover:border-rose-500/50 dark:border-rose-900/40",
    value: "text-rose-950 dark:text-rose-100",
    ribbon: "bg-rose-500",
    iconBox: "bg-rose-100 text-rose-600 group-hover:bg-rose-500 group-hover:text-white dark:bg-rose-900/50 dark:text-rose-400",
  },
  success: {
    border: "border-emerald-200/80 hover:border-emerald-500/50 dark:border-emerald-900/40",
    value: "text-emerald-950 dark:text-emerald-100",
    ribbon: "bg-[#017E84]",
    iconBox: "bg-[#017E84]/10 text-[#017E84] group-hover:bg-[#017E84] group-hover:text-white dark:bg-[#017E84]/20 dark:text-emerald-400",
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900",
        "border transition-all duration-300",
        cfg.border,
        "shadow-sm hover:shadow-xl hover:shadow-[#FF8200]/10 hover:-translate-y-1 dark:shadow-none",
        featured
          ? "p-7 sm:p-8 bg-gradient-to-br from-white via-[#FF8200]/5 to-[#E07400]/5 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border-[#FF8200]/30"
          : "p-5 sm:p-6 pl-7 sm:pl-8"
      )}
    >
      {/* Signature Odoo Left Vertical Accent Ribbon */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-2 transition-all duration-300 group-hover:w-3", cfg.ribbon)} />

      {/* Background ambient glow on hover */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FF8200]/5 blur-2xl group-hover:bg-[#FF8200]/15 transition-all duration-500 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
            {label}
          </span>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-xs",
              cfg.iconBox
            )}
          >
            <Icon weight="duotone" className={featured ? "h-6 w-6" : "h-5 w-5"} />
          </div>
        </div>

        {/* Value */}
        <div className="flex flex-col gap-1.5">
          {isNumber ? (
            <span
              className={cn(
                "font-extrabold tracking-tight tabular-nums leading-none drop-shadow-xs",
                featured ? "text-5xl sm:text-6xl text-slate-900 dark:text-white" : "text-3xl sm:text-[2.5rem]",
                cfg.value
              )}
            >
              <AnimatedNumber value={value as number} className="contents" />
            </span>
          ) : (
            <span
              className={cn(
                "font-extrabold tracking-tight tabular-nums leading-none drop-shadow-xs",
                featured ? "text-5xl sm:text-6xl text-slate-900 dark:text-white" : "text-3xl sm:text-[2.5rem]",
                cfg.value
              )}
            >
              {value}
            </span>
          )}
          {description && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", cfg.ribbon)} />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  {description}
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-[#FF8200] group-hover:translate-x-0.5 transition-all">
                Détails &rarr;
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

