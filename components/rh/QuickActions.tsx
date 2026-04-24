"use client";

import {
  UserPlus,
  FilePlus,
  CalendarPlus,
  Calculator,
  ClipboardText,
  ShieldWarning,
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "framer-motion";

const actions = [
  { title: "Nouvel employé", description: "Onboarding", icon: UserPlus, href: "/employes" },
  { title: "Générer contrat", description: "Modèles CI", icon: FilePlus, href: "/contrats" },
  { title: "Calcul STC", description: "Solde tout compte", icon: Calculator, href: "/calculateur" },
  { title: "Congé", description: "Absences", icon: CalendarPlus, href: "/conges" },
  { title: "Évaluation", description: "Performance", icon: ClipboardText, href: "/evaluations" },
  { title: "Procédure", description: "Disciplinaire", icon: ShieldWarning, href: "/disciplinaire" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {actions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
        >
          <Link href={action.href} className="group block">
            <div className="border border-slate-100 bg-white rounded-xl p-4 flex flex-col items-center text-center transition-all duration-200 hover:border-[oklch(0.78_0.13_73/0.5)] hover:shadow-[0_4px_20px_-4px_oklch(0.78_0.13_73/0.12)] active:scale-[0.97]">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.175_0.04_248)] flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105 group-hover:shadow-[0_4px_12px_-2px_oklch(0.175_0.04_248/0.35)]">
                <action.icon
                  weight="duotone"
                  className="h-[18px] w-[18px] text-[oklch(0.78_0.13_73)]"
                />
              </div>
              <p className="font-semibold text-[11px] text-slate-700 leading-tight mb-0.5 group-hover:text-slate-900 transition-colors">
                {action.title}
              </p>
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">
                {action.description}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
