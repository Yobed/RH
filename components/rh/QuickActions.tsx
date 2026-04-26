"use client";

import {
  UserPlus,
  FilePlus,
  CalendarPlus,
  Calculator,
  ClipboardText,
  ShieldWarning,
  CaretRight,
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const actions = [
  { 
    title: "Onboarding", 
    description: "Nouvel employé", 
    icon: UserPlus, 
    href: "/employes",
    color: "oklch(0.32 0.14 252)", // indigo
    light: "oklch(0.94 0.016 252)" 
  },
  { 
    title: "Contrats", 
    description: "Modèles CI", 
    icon: FilePlus, 
    href: "/contrats",
    color: "oklch(0.55 0.18 155)", // emerald
    light: "oklch(0.94 0.02 155)"
  },
  { 
    title: "STC", 
    description: "Calculateur", 
    icon: Calculator, 
    href: "/paie/fin-de-contrat",
    color: "oklch(0.78 0.13 73)", // amber
    light: "oklch(0.96 0.02 73)"
  },
  { 
    title: "Absences", 
    description: "Gestion congés", 
    icon: CalendarPlus, 
    href: "/conges",
    color: "oklch(0.577 0.245 27)", // rose/red
    light: "oklch(0.96 0.02 27)"
  },
  { 
    title: "Performance", 
    description: "Évaluations", 
    icon: ClipboardText, 
    href: "/evaluations",
    color: "oklch(0.627 0.265 303)", // violet
    light: "oklch(0.96 0.02 303)"
  },
  { 
    title: "Discipline", 
    description: "Procédures", 
    icon: ShieldWarning, 
    href: "/disciplinaire",
    color: "oklch(0.175 0.04 248)", // slate-dark
    light: "oklch(0.94 0.01 248)"
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {actions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href={action.href} className="group relative block h-full">
            <div className={cn(
              "relative h-full overflow-hidden rounded-[1.5rem] bg-white dark:bg-slate-950 p-5",
              "border border-slate-100/80 dark:border-slate-800/50",
              "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]",
              "transition-all duration-500 ease-[0.22,1,0.36,1]",
              "hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]",
              "active:scale-95"
            )}>
              {/* Internal Glow on Hover */}
              <div 
                className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-0 group-hover:opacity-[0.08] transition-opacity duration-700 blur-2xl pointer-events-none"
                style={{ backgroundColor: action.color }}
              />

              <div className="flex flex-col h-full gap-5">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[8deg]"
                  style={{ backgroundColor: action.light, color: action.color }}
                >
                  <action.icon weight="duotone" className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-sm text-slate-900 dark:text-white tracking-tightest leading-none">
                      {action.title}
                    </p>
                    <CaretRight 
                      weight="bold" 
                      className="w-3 h-3 text-slate-300 group-hover:translate-x-1 group-hover:text-slate-900 transition-all" 
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                    {action.description}
                  </p>
                </div>
              </div>
              
              {/* Subtle accent bar at bottom */}
              <div 
                className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-700"
                style={{ backgroundColor: action.color }}
              />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
