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
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface HrModule {
  title: string;
  href: string;
  icon: any;
  desc: string;
}

export function HrSuiteModulesWidget() {
  const modules: HrModule[] = [
    { title: "Recrutement ATS", href: "/recrutement", icon: UserPlus, desc: "Sourcing candidats, CVthèque & offres" },
    { title: "Portail employé", href: "/portail", icon: Users, desc: "Espace self-service & demandes RH" },
    { title: "Suivi du temps & pointage", href: "/pointage", icon: Clock, desc: "Calcul heures, présences & anomalies" },
    { title: "Évaluations de performance", href: "/evaluations", icon: Award, desc: "Entretiens annuels & suivi des KPIs" },
    { title: "Enquêtes QVT", href: "/bienvenue", icon: HeartHandshake, desc: "Climat social, baromètre & feedback" },
    { title: "Préparation de la paie", href: "/paie", icon: DollarSign, desc: "Simulations, contrôle & export Sage/X3/CNPS" },
    { title: "Signature numérique", href: "/contrats", icon: FileSignature, desc: "Validation légale & paraphage contrats" },
    { title: "HR Analytics BI", href: "/analytique", icon: PieChart, desc: "Masse salariale, effectifs & simulations" },
    { title: "Notes de frais", href: "/calculateur", icon: Receipt, desc: "Validation débours & justificatifs" },
    { title: "Canal de signalement", href: "/contentieux", icon: ShieldAlert, desc: "Conformité CNPS, légale & éthique" },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#0d9488]/10 flex items-center justify-center text-[#0d9488] border border-[#0d9488]/20 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Modules de la Suite RH</h3>
            <p className="text-xs text-slate-500 font-bold dark:text-slate-400">Accès rapide aux applications métier</p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Suite Complète 2026
        </span>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {modules.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <Link
              key={idx}
              href={mod.href}
              className="group p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-[#0d9488]/40 hover:shadow-lg hover:shadow-[#0d9488]/5 transition-all duration-200 flex items-center gap-3 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:border-slate-700/60"
            >
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-[#0d9488] group-hover:text-white flex items-center justify-center shrink-0 transition-colors border border-slate-200 dark:border-slate-700 group-hover:border-[#0d9488] shadow-xs">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0d9488] truncate transition-colors">
                  {mod.title}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate mt-0.5">{mod.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0d9488] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-right">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#0d9488] dark:hover:text-[#0d9488] cursor-pointer inline-flex items-center gap-1.5 transition-colors">
          ... et plus encore dans votre portail d'entreprise ➔
        </span>
      </div>
    </div>
  );
}

