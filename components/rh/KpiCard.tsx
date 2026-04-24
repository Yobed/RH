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
    glow: "hover:shadow-[0_12px_40px_-8px_oklch(0.38_0.10_252/0.18)]",
    dot: "bg-[oklch(0.38_0.10_252)]",
    value: "text-slate-900",
    iconWrap: "bg-[oklch(0.955_0.012_252)] text-[oklch(0.38_0.10_252)]",
  },
  warning: {
    glow: "hover:shadow-[0_12px_40px_-8px_oklch(0.75_0.18_65/0.2)]",
    dot: "bg-amber-500",
    value: "text-amber-700",
    iconWrap: "bg-amber-50 text-amber-600",
  },
  danger: {
    glow: "hover:shadow-[0_12px_40px_-8px_oklch(0.577_0.245_27/0.2)]",
    dot: "bg-red-500",
    value: "text-red-700",
    iconWrap: "bg-red-50 text-red-600",
  },
  success: {
    glow: "hover:shadow-[0_12px_40px_-8px_oklch(0.55_0.18_155/0.2)]",
    dot: "bg-emerald-500",
    value: "text-emerald-700",
    iconWrap: "bg-emerald-50 text-emerald-600",
  },
};

function AnimatedNumber({ value, className }: { value: number; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.23, 1, 0.32, 1],
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
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: index * 0.07 }}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white",
        "border border-slate-100/80",
        "shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] transition-shadow duration-300",
        cfg.glow,
        featured ? "p-7" : "p-5"
      )}
    >
      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      <div className="relative">
        {/* Label row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 truncate">
              {label}
            </p>
          </div>
          <div className={cn("rounded-lg p-1.5 shrink-0", cfg.iconWrap)}>
            <Icon weight="duotone" className={featured ? "h-5 w-5" : "h-[15px] w-[15px]"} />
          </div>
        </div>

        {/* Value */}
        <div className="flex flex-col gap-1.5">
          {isNumber ? (
            <AnimatedNumber
              value={value as number}
              className={cn(
                "font-bold tracking-tight tabular-nums leading-none font-mono",
                featured ? "text-5xl" : "text-[2rem]",
                cfg.value
              )}
            />
          ) : (
            <span
              className={cn(
                "font-bold tracking-tight tabular-nums leading-none font-mono",
                featured ? "text-5xl" : "text-[2rem]",
                cfg.value
              )}
            >
              {value}
            </span>
          )}
          {description && (
            <span className="text-xs font-medium text-slate-400">{description}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
