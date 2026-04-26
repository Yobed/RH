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
  CONTRACT: { icon: FileText, color: "oklch(0.78 0.13 73)", bg: "oklch(0.96 0.02 73)" },
  TRIAL: { icon: Clock, color: "oklch(0.55 0.18 155)", bg: "oklch(0.94 0.02 155)" },
  MEDICAL: { icon: Pulse, color: "oklch(0.32 0.14 252)", bg: "oklch(0.94 0.016 252)" },
  DOCUMENT: { icon: ShieldWarning, color: "oklch(0.577 0.245 27)", bg: "oklch(0.96 0.02 27)" },
};

export function ComplianceAlertList({ alerts }: ComplianceAlertListProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-[2.5rem] border border-slate-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
      <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
            <Warning weight="bold" className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tightest leading-none">Vigilance Prioritaire</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Alertes de conformité</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm">
          {alerts.length} Alertes
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {alerts.map((alert, i) => {
          const cfg = typeConfig[alert.type] || typeConfig.DOCUMENT;
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="px-8 py-5 hover:bg-slate-50/50 transition-all duration-300 flex items-center justify-between gap-6 group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div 
                  className="h-12 w-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[8deg]"
                  style={{ backgroundColor: cfg.bg, color: cfg.color }}
                >
                  <cfg.icon weight="duotone" className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <Link 
                    href={`/employes/${alert.id}`} 
                    className="text-sm font-black text-slate-900 tracking-tight leading-none hover:text-slate-600"
                  >
                    {alert.employeeName}
                  </Link>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                      {alert.label}
                    </span>
                    {alert.date && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-mono font-black text-slate-400">
                          {new Date(alert.date).toLocaleDateString('fr-FR')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                {alert.urgency === "high" && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Urgent</span>
                  </div>
                )}
                <Link 
                  href={`/employes/${alert.id}`} 
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-300"
                >
                  <CaretRight weight="bold" className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="p-4 bg-slate-50/30 border-t border-slate-50 mt-auto">
        <Link 
          href="/reporting" 
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
        >
          Accéder au centre de conformité
        </Link>
      </div>
    </div>
  );
}
