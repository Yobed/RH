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
              "relative h-full overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5",
              "border border-slate-200/90 dark:border-slate-800",
              "shadow-sm hover:shadow-xl hover:shadow-[#FF8200]/10 hover:border-[#FF8200]/50 hover:-translate-y-1",
              "transition-all duration-300"
            )}>
              {/* Top hover accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF8200] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex flex-col h-full justify-between gap-4 relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-slate-100/80 dark:bg-slate-800/80 text-[#FF8200] dark:text-[#FF8200] group-hover:bg-[#FF8200] group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-2xs">
                  <action.icon weight="duotone" className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#FF8200] transition-colors leading-tight">
                      {action.title}
                    </p>
                    <CaretRight 
                      weight="bold" 
                      className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-[#FF8200] transition-all shrink-0" 
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
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
