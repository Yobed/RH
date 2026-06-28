"use client";

import {
  UserPlus,
  FilePlus,
  Money,
  CalendarPlus,
  ClipboardText,
  UserMinus,
  CaretRight,
  Lightning,
} from "@phosphor-icons/react";
import Link from "next/link";

interface QuickAction {
  title: string;
  verb: string; // verbe d'action visible (réduit la friction cognitive)
  icon: typeof UserPlus;
  href: string;
}

// 3 actions les plus utilisées, mises en avant
const PRIMARY: QuickAction[] = [
  { title: "Recruter un talent", verb: "Démarrer", icon: UserPlus, href: "/recrutement" },
  { title: "Lancer la paie", verb: "Lancer", icon: Money, href: "/paie/generer-lot" },
  { title: "Traiter une absence", verb: "Traiter", icon: CalendarPlus, href: "/conges" },
];

// Actions secondaires, plus compactes
const SECONDARY: QuickAction[] = [
  { title: "Créer un contrat", verb: "Créer", icon: FilePlus, href: "/contrats" },
  { title: "Évaluer un salarié", verb: "Évaluer", icon: ClipboardText, href: "/evaluations" },
  { title: "Préparer un départ", verb: "Préparer", icon: UserMinus, href: "/offboarding" },
];

export function QuickActions() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]/10 text-[#047857] dark:text-[#2dd4bf]">
          <Lightning weight="fill" className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white">Actions rapides RH</h3>
          <p className="text-[11px] font-medium text-slate-400">Procédures fréquentes</p>
        </div>
      </div>

      {/* 3 actions prioritaires — grandes cartes */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PRIMARY.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 transition-all hover:-translate-y-0.5 hover:border-[#059669]/40 hover:bg-white hover:shadow-[0_10px_24px_-14px_rgba(13,148,136,0.45)] dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#059669] text-white shadow-sm transition-transform group-hover:scale-105">
                <Icon weight="duotone" className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">{a.title}</p>
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#047857] dark:text-[#2dd4bf]">
                {a.verb} <CaretRight weight="bold" className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Actions secondaires — ligne compacte */}
      <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 sm:grid-cols-3">
        {SECONDARY.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors group-hover:text-[#047857] dark:border-slate-700 dark:bg-slate-900">
                <Icon weight="duotone" className="h-4 w-4" />
              </span>
              <span className="truncate text-[12px] font-medium text-slate-600 group-hover:text-slate-900 dark:text-slate-300">{a.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
