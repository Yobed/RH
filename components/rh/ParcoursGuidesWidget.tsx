"use client";

import React, { useState } from "react";
import { 
  UserPlus, 
  FileClock, 
  Calculator, 
  CalendarCheck2, 
  ChevronRight, 
  Sparkles, 
  CheckCircle, 
  ArrowRight,
  ShieldAlert,
  Play
} from "lucide-react";
import { GuidedWorkflowWorkspace } from "./GuidedWorkflowWorkspace";

export function ParcoursGuidesWidget() {
  const [activeModal, setActiveModal] = useState<"employee" | "contract" | "paie" | "conges" | null>(null);

  const PARCOURS = [
    {
      id: "employee",
      title: "Nouveau Salarié",
      subtitle: "Onboarding & Dossier Contractuel",
      desc: "Créer la fiche, intégrer les pièces CNPS/CIV et générer le contrat d'embauche.",
      icon: UserPlus,
      badge: "Onboarding",
      badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
      cta: "Lancer le parcours",
      accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    },
    {
      id: "contract",
      title: "Contrat à Échéance",
      subtitle: "Renouvellement & Échéances CDD",
      desc: "Vérifier les CDD à terme (<30j), décider d'un avenant, passage en CDI ou STC.",
      icon: FileClock,
      badge: "Échéancier",
      badgeColor: "bg-rose-500/10 text-rose-600 border-rose-500/30",
      cta: "Traiter les CDD",
      accent: "from-rose-500/20 via-rose-500/5 to-transparent",
    },
    {
      id: "paie",
      title: "Préparation de Paie",
      subtitle: "Contrôle, Variables & Exports",
      desc: "Valider les heures supp., calculer le livre de paie et exporter vers Sage/X3.",
      icon: Calculator,
      badge: "Mensuel",
      badgeColor: "bg-[#FF8200]/10 text-[#FF8200] border-[#FF8200]/30",
      cta: "Lancer la paie",
      accent: "from-[#FF8200]/20 via-[#FF8200]/5 to-transparent",
    },
    {
      id: "conges",
      title: "Validation de Congé",
      subtitle: "Arbitrage & Planning d'Absences",
      desc: "Examiner les demandes en attente, vérifier les soldes et valider en 1 clic.",
      icon: CalendarCheck2,
      badge: "Arbitrage",
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      cta: "Valider congés",
      accent: "from-amber-500/20 via-amber-500/5 to-transparent",
    },
  ];

  return (
    <>
      <div className="rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden p-6 transition-all">
        {/* En-tête de section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#FF8200] text-white flex items-center justify-center shadow-lg shadow-[#FF8200]/25 shrink-0">
              <Play className="h-5 w-5 fill-white stroke-none ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Parcours Guidés de Pilotage
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                  Procédures Clés
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                Exécution pas-à-pas des 4 opérations RH fondamentales quotidiennes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-[11px] font-black text-slate-400">
            <span>Détecter</span>
            <ChevronRight className="h-3 w-3 text-[#FF8200]" />
            <span className="text-slate-900 dark:text-white">Agir</span>
            <ChevronRight className="h-3 w-3 text-[#FF8200]" />
            <span>Tracer</span>
          </div>
        </div>

        {/* Grille des 4 Parcours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PARCOURS.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setActiveModal(item.id as any)}
                className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 hover:bg-white dark:hover:bg-slate-800 hover:border-[#FF8200]/60 hover:shadow-xl hover:shadow-[#FF8200]/5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Background accent glow on hover */}
                <div className={`absolute top-0 right-0 left-0 h-20 bg-gradient-to-b ${item.accent} opacity-0 group-hover:opacity-100 rounded-t-2xl transition-opacity duration-300 pointer-events-none`} />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover:border-[#FF8200]/50 group-hover:bg-[#FF8200] group-hover:text-white flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors shadow-2xs">
                      <IconComp className="h-5 w-5 stroke-[2]" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#FF8200] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-black text-[#FF8200] group-hover:translate-x-0.5 transition-transform">
                  <span>{item.cta}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Espace de travail guidé réactif (Détecter -> Agir -> Tracer) */}
      {activeModal && (
        <GuidedWorkflowWorkspace
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          workflow={activeModal}
        />
      )}
    </>
  );
}
