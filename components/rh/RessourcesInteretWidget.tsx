"use client";

import { FileText, ExternalLink, ShieldAlert, TrendingUp, Bookmark } from "lucide-react";
import Link from "next/link";

export function RessourcesInteretWidget() {
  const resources = [
    { title: "Protocole Sanitaire & Sécurité", category: "Conformité", icon: ShieldAlert, color: "text-rose-600 bg-rose-50" },
    { title: "Barème d'imposition ITS & CNPS", category: "Paie 2026", icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
    { title: "Guide de personnalisation de la signature", category: "Charte HR", icon: Bookmark, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ressources d'intérêt</h3>
        </div>
      </div>

      <div className="space-y-2">
        {resources.map((res, idx) => {
          const Icon = res.icon;
          return (
            <Link
              key={idx}
              href="/ged"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${res.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 truncate transition-colors">
                    {res.title}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">{res.category}</span>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
