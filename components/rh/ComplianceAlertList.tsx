"use client";

import { 
  Warning, 
  Clock, 
  FileText, 
  Pulse, 
  ShieldWarning,
  CaretRight 
} from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

const typeConfig = {
  CONTRACT: { icon: FileText, className: "bg-orange-50 text-[#FF8200] dark:bg-orange-950/40 dark:text-[#FF8200]" },
  TRIAL: { icon: Clock, className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
  MEDICAL: { icon: Pulse, className: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  DOCUMENT: { icon: ShieldWarning, className: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
};

export function ComplianceAlertList({ alerts }: ComplianceAlertListProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF8200]/10 text-[#FF8200] flex items-center justify-center">
            <Warning weight="bold" className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Vigilance Prioritaire</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Alertes de conformité</p>
          </div>
        </div>
        <div className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-xs">
          {alerts.length} Alertes
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
        {alerts.map((alert, i) => {
          const cfg = typeConfig[alert.type] || typeConfig.DOCUMENT;
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150 flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div 
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${cfg.className}`}
                >
                  <cfg.icon weight="duotone" className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <Link 
                    href={`/employes/${alert.id}`} 
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block hover:text-[#FF8200] dark:hover:text-[#FF8200] transition-colors"
                  >
                    {alert.employeeName}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {alert.label}
                    </span>
                    {alert.date && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                          {new Date(alert.date).toLocaleDateString('fr-FR')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                {alert.urgency === "high" && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">Urgent</span>
                  </div>
                )}
                <Link 
                  href={`/employes/${alert.id}`} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#FF8200] hover:text-white hover:border-[#FF8200] dark:hover:bg-[#FF8200] dark:hover:text-white dark:hover:border-[#FF8200] transition-colors duration-150"
                >
                  <CaretRight weight="bold" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
        <Link 
          href="/reporting" 
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#FF8200] dark:hover:text-[#FF8200] transition-colors shadow-xs"
        >
          Accéder au centre de conformité
        </Link>
      </div>
    </div>
  );
}
