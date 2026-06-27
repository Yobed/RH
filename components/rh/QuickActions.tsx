"use client";

import {
  UserPlus,
  FilePlus,
  CalendarPlus,
  Money,
  ClipboardText,
  UserMinus,
  CaretRight,
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const actions = [
  {
    title: "Recruter",
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
    description: "Performance",
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {actions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.04 }}
        >
          <Link href={action.href} className="group relative block h-full">
            <div className={cn(
              "relative h-full overflow-hidden rounded-xl bg-white dark:bg-slate-900 p-4",
              "border border-slate-200 dark:border-slate-800",
              "shadow-sm hover:shadow-md hover:border-[#FF8200]/50 dark:hover:border-[#FF8200]/50",
              "transition-all duration-200"
            )}>
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 group-hover:bg-[#FF8200] group-hover:text-white transition-colors duration-200">
                  <action.icon weight="duotone" className="w-5 h-5" />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#FF8200] transition-colors">
                      {action.title}
                    </p>
                    <CaretRight 
                      weight="bold" 
                      className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#FF8200] transition-all shrink-0" 
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {action.description}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
