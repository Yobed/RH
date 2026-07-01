"use client";

import {
  Warning,
  Clock,
  FileText,
  Pulse,
  ShieldWarning,
  CaretRight,
} from "@phosphor-icons/react";
import Link from "next/link";

interface AlertItem {
  id: string;
  type: "CONTRACT" | "TRIAL" | "MEDICAL" | "DOCUMENT";
  label: string;
  employeeName: string;
  date?: string;
  urgency: "high" | "medium" | "low";
}

interface ComplianceAlertListProps {
  alerts: AlertItem[];
}

const TYPE_ICON = {
  CONTRACT: FileText,
  TRIAL: Clock,
  MEDICAL: Pulse,
  DOCUMENT: ShieldWarning,
};

const URGENCY_STYLE: Record<AlertItem["urgency"], { chip: string; tag: string; label: string }> = {
  high: { chip: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400", tag: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300", label: "Urgent" },
  medium: { chip: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400", tag: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", label: "À suivre" },
  low: { chip: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", tag: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", label: "Info" },
};

const MAX_VISIBLE = 4;

export function ComplianceAlertList({ alerts }: ComplianceAlertListProps) {
  if (alerts.length === 0) return null;

  const visible = alerts.slice(0, MAX_VISIBLE);
  const remaining = alerts.length - visible.length;

  return (
    // Panneau à forte visibilité : fond teinté ambre (risque RH)
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/40 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10">
      <div className="flex items-center justify-between border-b border-amber-200/60 px-5 py-4 dark:border-amber-900/40">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Warning weight="fill" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-sm font-bold leading-none text-slate-900 dark:text-white">Vigilance prioritaire</h2>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">Alertes de conformité RH</p>
          </div>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex-1 divide-y divide-amber-100/70 dark:divide-amber-900/30">
        {visible.map((alert, i) => {
          const Icon = TYPE_ICON[alert.type] || ShieldWarning;
          const u = URGENCY_STYLE[alert.urgency];
          return (
            <Link
              key={`${alert.id}-${i}`}
              href={`/employes/${alert.id}`}
              className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-white/70 dark:hover:bg-slate-900/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${u.chip}`}>
                  <Icon weight="duotone" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-[#d67002] dark:text-white">
                    {alert.employeeName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{alert.label}</span>
                    {alert.date && (
                      <span className="shrink-0 font-mono text-[11px] text-slate-400">
                        {new Date(alert.date).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline ${u.tag}`}>
                  {u.label}
                </span>
                <CaretRight weight="bold" className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#d67002]" />
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/reporting"
        className="flex items-center justify-center gap-2 border-t border-amber-200/60 px-5 py-3 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100/50 dark:border-amber-900/40 dark:text-amber-300"
      >
        {remaining > 0 ? `Voir toutes les alertes (${remaining} de plus)` : "Voir toutes les alertes"}
        <CaretRight weight="bold" className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
