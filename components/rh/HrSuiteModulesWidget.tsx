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
    { title: "Recrutement ATS", href: "/recrutement", icon: UserPlus, desc: "Sourcing & gestion des candidats" },
    { title: "Portail employé", href: "/portail", icon: Users, desc: "Espace self-service collaborateurs" },
    { title: "Suivi du temps et pointage", href: "/pointage", icon: Clock, desc: "Heures, présence & feuille de temps" },
    { title: "Évaluations de performance", href: "/evaluations", icon: Award, desc: "Entretiens annuels & objectifs KPI" },
    { title: "Enquêtes QVT", href: "/bienvenue", icon: HeartHandshake, desc: "Qualité de vie au travail & climat" },
    { title: "Préparation de la paie", href: "/paie", icon: DollarSign, desc: "Calculs ITS/CNPS & bulletins" },
    { title: "Signature numérique", href: "/contrats", icon: FileSignature, desc: "Validation légale des contrats" },
    { title: "HR analytics", href: "/analytique", icon: PieChart, desc: "Tableaux de bord & masse salariale" },
    { title: "Notes de frais", href: "/calculateur", icon: Receipt, desc: "Remboursements & dépenses" },
    { title: "Canal de signalement", href: "/contentieux", icon: ShieldAlert, desc: "Conformité & alerte éthique" },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-950 relative overflow-hidden">
      {/* Subtle glowing orb decoration */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight text-white">Modules de la Suite RH</h3>
            <p className="text-xs text-blue-200/70 font-medium">Accès rapide aux applications métier</p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
          Suite Complète 2026
        </span>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative z-10">
        {modules.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <Link
              key={idx}
              href={mod.href}
              className="group p-3.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-blue-400/50 transition-all duration-200 flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-600/30 group-hover:bg-blue-500 text-blue-300 group-hover:text-white flex items-center justify-center shrink-0 transition-colors border border-blue-400/20">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white group-hover:text-blue-200 truncate transition-colors">
                  {mod.title}
                </h4>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{mod.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 text-right relative z-10">
        <span className="text-xs font-extrabold text-blue-300 hover:text-white cursor-pointer inline-flex items-center gap-1">
          ... et plus encore dans votre portail d'entreprise ➔
        </span>
      </div>
    </div>
  );
}
