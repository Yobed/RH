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
    border: "border-slate-200 dark:border-slate-800",
    dot: "bg-[#FF8200]",
    value: "text-slate-900 dark:text-slate-100",
    iconWrap: "bg-orange-50 text-[#FF8200] dark:bg-orange-950/40 dark:text-[#FF8200]",
  },
  warning: {
    border: "border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
    value: "text-amber-900 dark:text-amber-200",
    iconWrap: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  danger: {
    border: "border-red-200 dark:border-red-900/50",
    dot: "bg-red-500",
    value: "text-red-900 dark:text-red-200",
    iconWrap: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
  success: {
    border: "border-emerald-200 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
    value: "text-emerald-900 dark:text-emerald-200",
    iconWrap: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
};

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.8,
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-white dark:bg-slate-900",
        "border",
        cfg.border,
        "shadow-sm hover:shadow-md transition-all duration-200",
        featured ? "p-6" : "p-4 sm:p-5"
      )}
    >
      <div className="relative">
        {/* Label & Icon Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("h-2 w-2 rounded-full shrink-0", cfg.dot)} />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 truncate">
              {label}
            </p>
          </div>
          <div className={cn("rounded-lg p-2 shrink-0 transition-transform group-hover:scale-105", cfg.iconWrap)}>
            <Icon weight="duotone" className={featured ? "h-5 w-5" : "h-4 w-4"} />
          </div>
        </div>

        {/* Metric Value */}
        <div className="flex flex-col gap-1">
          {isNumber ? (
            <span
              className={cn(
                "font-bold tracking-tight tabular-nums leading-none",
                featured ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
                cfg.value
              )}
            >
              <AnimatedNumber value={value as number} className="contents" />
            </span>
          ) : (
            <span
              className={cn(
                "font-bold tracking-tight tabular-nums leading-none",
                featured ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
                cfg.value
              )}
            >
              {value}
            </span>
          )}
          {description && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal mt-1">
              {description}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
