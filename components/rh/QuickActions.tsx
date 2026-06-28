"use client";

import {
  UserPlus,
  FilePlus,
  CalendarPlus,
  Money,
  ClipboardText,
  UserMinus,
  CaretRight,
  Lightning,
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const actions = [
  {
    title: "Recruter un talent",
    description: "Offres & candidats",
    icon: UserPlus,
    href: "/recrutement",
  },
  {
    title: "Créer un contrat",
    description: "CDI · CDD · avenant",
    icon: FilePlus,
    href: "/contrats",
  },
  {
    title: "Lancer la paie",
    description: "Bulletins du mois",
    icon: Money,
    href: "/paie/generer-lot",
  },
  {
    title: "Traiter une absence",
    description: "Congés & absences",
    icon: CalendarPlus,
    href: "/conges",
  },
  {
    title: "Évaluer un salarié",
    description: "Performance & entretiens",
    icon: ClipboardText,
    href: "/evaluations",
  },
  {
    title: "Préparer un départ",
    description: "Offboarding & STC",
    icon: UserMinus,
    href: "/offboarding",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
      {/* En-tête du widget */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-[#0d9488] flex items-center justify-center">
            <Lightning weight="fill" className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Actions Rapides RH
            </h3>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Procédures et raccourcis fréquents
            </p>
          </div>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          6 raccourcis
        </span>
      </div>

      {/* Grille de cartes horizontales spacieuses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
          >
            <Link href={action.href} className="group relative block h-full">
              <div className={cn(
                "relative h-full overflow-hidden rounded-xl bg-slate-50/70 dark:bg-slate-800/40 p-3",
                "border border-slate-200/80 dark:border-slate-700/60",
                "hover:bg-white dark:hover:bg-slate-800 hover:border-[#0d9488]/50 hover:shadow-md hover:shadow-orange-500/5 hover:-translate-y-0.5",
                "transition-all duration-200 flex items-center gap-3"
              )}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white dark:bg-slate-700 text-[#0d9488] border border-slate-200/60 dark:border-slate-600 group-hover:bg-[#0d9488] group-hover:text-white group-hover:border-[#0d9488] transition-all duration-200 shadow-2xs">
                  <action.icon weight="duotone" className="w-4.5 h-4.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#0d9488] transition-colors truncate">
                    {action.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">
                    {action.description}
                  </p>
                </div>

                <CaretRight 
                  weight="bold" 
                  className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0d9488] group-hover:translate-x-1 transition-all shrink-0" 
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

