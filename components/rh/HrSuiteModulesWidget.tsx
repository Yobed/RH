"use client";

import Link from "next/link";
import {
  UserPlus,
  Users,
  Clock,
  Award,
  HeartHandshake,
  DollarSign,
  FileSignature,
  PieChart,
  Receipt,
  ShieldAlert,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";

interface HrModule {
  title: string;
  href: string;
  icon: typeof Users;
  desc: string; // baseline courte — 1 ligne max
}

const MODULES: HrModule[] = [
  { title: "Recrutement ATS", href: "/recrutement", icon: UserPlus, desc: "Sourcing, CVthèque, offres" },
  { title: "Portail employé", href: "/portail", icon: Users, desc: "Self-service & demandes" },
  { title: "Temps & pointage", href: "/pointage", icon: Clock, desc: "Présences & anomalies" },
  { title: "Évaluations", href: "/evaluations", icon: Award, desc: "Entretiens & KPIs" },
  { title: "Enquêtes QVT", href: "/bienvenue", icon: HeartHandshake, desc: "Climat & baromètre" },
  { title: "Paie", href: "/paie", icon: DollarSign, desc: "Bulletins & contrôles" },
  { title: "Signature numérique", href: "/contrats", icon: FileSignature, desc: "Contrats & paraphage" },
  { title: "HR Analytics", href: "/analytique", icon: PieChart, desc: "Effectifs & masse salariale" },
  { title: "Conformité & litiges", href: "/contentieux", icon: ShieldAlert, desc: "CNPS, légal & éthique" },
];

export function HrSuiteModulesWidget() {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ee7f03]/10 text-[#d67002] dark:text-[#2dd4bf]">
          <LayoutGrid className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Modules de la suite RH
          </h3>
          <p className="text-[11px] font-medium text-slate-400">Accès aux applications métier</p>
        </div>
      </div>

      {/* Grille uniforme 2 → 3 colonnes, cartes de même taille */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="group flex flex-col gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 transition-all hover:-translate-y-0.5 hover:border-[#ee7f03]/40 hover:bg-white hover:shadow-[0_10px_24px_-14px_rgba(238,127,3,0.45)] dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors group-hover:border-[#ee7f03] group-hover:bg-[#ee7f03] group-hover:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">{mod.title}</h4>
                <p className="truncate text-[11px] text-slate-400">{mod.desc}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#d67002] opacity-0 transition-opacity group-hover:opacity-100 dark:text-[#2dd4bf]">
                Ouvrir <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
