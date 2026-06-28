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
  CONTRACT: { icon: FileText, className: "bg-slate-50 border border-slate-200/60 text-slate-600 dark:bg-slate-850 dark:border-slate-700/60 dark:text-slate-300" },
  TRIAL: { icon: Clock, className: "bg-slate-50 border border-slate-200/60 text-slate-600 dark:bg-slate-850 dark:border-slate-700/60 dark:text-slate-300" },
  MEDICAL: { icon: Pulse, className: "bg-slate-50 border border-slate-200/60 text-slate-600 dark:bg-slate-850 dark:border-slate-700/60 dark:text-slate-300" },
  DOCUMENT: { icon: ShieldWarning, className: "bg-slate-50 border border-slate-200/60 text-slate-600 dark:bg-slate-850 dark:border-slate-700/60 dark:text-slate-300" },
};

export function ComplianceAlertList({ alerts }: ComplianceAlertListProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60">
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
                    className="text-sm font-semibold text-slate-900 truncate block hover:text-[#0d9488] transition-colors"
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
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Urgent
                  </span>
                )}
                <Link 
                  href={`/employes/${alert.id}`} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488] transition-colors duration-150"
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
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0d9488] transition-colors shadow-xs"
        >
          Accéder au centre de conformité
        </Link>
      </div>
    </div>
  );
}
