"use client";

import { FileText, ExternalLink, ShieldAlert, TrendingUp, Bookmark } from "lucide-react";
import Link from "next/link";

export function RessourcesInteretWidget() {
  const resources = [
    { title: "Protocole Sanitaire & Sécurité", category: "Conformité", icon: ShieldAlert, color: "text-rose-600 bg-rose-50 border-rose-200" },
    { title: "Barème d'imposition ITS & CNPS", category: "Paie 2026", icon: TrendingUp, color: "text-[#ee7f03] bg-[#ee7f03]/10 border-[#ee7f03]/30" },
    { title: "Guide de personnalisation de la signature", category: "Charte HR", icon: Bookmark, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Ressources & Guides RH</h3>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Documentation rapide</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {resources.map((res, idx) => {
            const Icon = res.icon;
            return (
              <Link
                key={idx}
                href="/ged"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${res.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 truncate transition-colors">
                      {res.title}
                    </p>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{res.category}</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
