import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "warning" | "danger" | "success";
}

const variantConfig = {
  default: {
    bar: "bg-primary",
    icon: "bg-primary/10 text-primary",
    value: "text-foreground",
  },
  warning: {
    bar: "bg-amber-500",
    icon: "bg-amber-50 text-amber-600",
    value: "text-amber-700",
  },
  danger: {
    bar: "bg-red-500",
    icon: "bg-red-50 text-red-600",
    value: "text-red-700",
  },
  success: {
    bar: "bg-emerald-500",
    icon: "bg-emerald-50 text-emerald-600",
    value: "text-emerald-700",
  },
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  description,
  variant = "default",
}: KpiCardProps) {
  const cfg = variantConfig[variant];

  return (
    <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Barre colorée en haut */}
      <div className={cn("h-1 w-full", cfg.bar)} />

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground truncate">
              {label}
            </p>
            <p className={cn("mt-2 text-3xl font-bold tracking-tight", cfg.value)}>
              {value}
            </p>
            {description && (
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <div className={cn("rounded-xl p-2.5 shrink-0", cfg.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
