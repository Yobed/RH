"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  Users,
  Money,
  CalendarBlank,
  FileText,
  ChartPieSlice,
  Scales,
  Robot,
  Gear,
  UserPlus,
  ChartLineUp,
  Archive,
  FilePdf,
  Books,
  Clock,
  Presentation,
  Student,
  FirstAid,
  ShieldWarning,
  Calculator,
  Bank,
  Stamp,
  Bell,
  ChatCircleText,
  Target,
  TreeStructure,
  CalendarCheck,
  BellRinging,
  ChartBar,
} from "@phosphor-icons/react";

interface NavCommand {
  id: string;
  label: string;
  group: string;
  href: string;
  icon: React.ElementType;
  keywords?: string[];
}

const commands: NavCommand[] = [
  // Vue d'ensemble
  { id: "dashboard", label: "Tableau de bord", group: "Vue d'ensemble", href: "/rh", icon: ChartPieSlice, keywords: ["accueil", "home"] },
  { id: "rappels", label: "Rappels & Échéances", group: "Vue d'ensemble", href: "/rappels", icon: BellRinging },
  { id: "analytique", label: "Analytique RH", group: "Vue d'ensemble", href: "/analytique", icon: ChartPieSlice, keywords: ["stats", "kpi"] },
  { id: "focus", label: "Focus Stratégique", group: "Vue d'ensemble", href: "/analytique/focus", icon: Target },
  // Collaborateurs
  { id: "employes", label: "Fiches collaborateurs", group: "Collaborateurs", href: "/employes", icon: Users, keywords: ["salaries", "liste", "staff"] },
  { id: "organigramme", label: "Organigramme", group: "Collaborateurs", href: "/employes/organigramme", icon: TreeStructure },
  { id: "contrats", label: "Contrats", group: "Collaborateurs", href: "/contrats", icon: FileText, keywords: ["cdi", "cdd"] },
  { id: "conges", label: "Absences & Congés", group: "Collaborateurs", href: "/conges", icon: CalendarBlank, keywords: ["absence", "vacances"] },
  { id: "planning", label: "Planning & Shifts", group: "Collaborateurs", href: "/planning", icon: CalendarCheck },
  { id: "heures-sup", label: "Heures supplémentaires", group: "Collaborateurs", href: "/heures-sup", icon: Clock },
  { id: "onboarding", label: "Onboarding", group: "Collaborateurs", href: "/onboarding", icon: UserPlus },
  // Paie & Conformité
  { id: "paie", label: "Bulletins de paie", group: "Paie & Conformité", href: "/paie", icon: Money, keywords: ["bulletin", "salaire"] },
  { id: "analyses", label: "Finance & Data", group: "Paie & Conformité", href: "/analyses", icon: ChartBar },
  { id: "lot", label: "Génération en lot", group: "Paie & Conformité", href: "/paie/generer-lot", icon: Stamp },
  { id: "bordereau", label: "Bordereau de virement", group: "Paie & Conformité", href: "/paie/bordereau", icon: Bank },
  { id: "stc", label: "Fin de contrat / STC", group: "Paie & Conformité", href: "/paie/fin-de-contrat", icon: FileText },
  { id: "declarations", label: "Déclarations & Conformité", group: "Paie & Conformité", href: "/declarations", icon: Stamp, keywords: ["cnps", "dgi", "impot"] },
  { id: "sage", label: "Import Sage Paie", group: "Paie & Conformité", href: "/paie/import-sage", icon: ChartBar },
  // Documents
  { id: "documents-rh", label: "Documents RH", group: "Documents", href: "/documents-rh", icon: FilePdf },
  { id: "ged", label: "GED", group: "Documents", href: "/ged", icon: Books, keywords: ["gestion documentaire"] },
  { id: "archives", label: "Archives", group: "Documents", href: "/archives", icon: Archive },
  // Développement RH
  { id: "recrutement", label: "Recrutement", group: "Développement RH", href: "/recrutement", icon: UserPlus, keywords: ["candidats", "offre"] },
  { id: "evaluations", label: "Évaluations & Performance", group: "Développement RH", href: "/evaluations", icon: ChartLineUp, keywords: ["performance", "appréciation"] },
  { id: "formation", label: "Formation FDFP", group: "Développement RH", href: "/formation", icon: Student },
  // Qualité & Risques
  { id: "contentieux", label: "Contentieux", group: "Qualité & Risques", href: "/contentieux", icon: Scales, keywords: ["litige", "inspection"] },
  { id: "qhse", label: "QHSE & Accidents", group: "Qualité & Risques", href: "/qhse", icon: FirstAid },
  { id: "duerp", label: "DUERP", group: "Qualité & Risques", href: "/duerp", icon: ShieldWarning },
  { id: "bilan-social", label: "Bilan social annuel", group: "Qualité & Risques", href: "/bilan-social", icon: Books },
  // Reporting & Comms
  { id: "reporting", label: "Reporting RH", group: "Reporting & Comms", href: "/reporting", icon: Presentation },
  { id: "messages", label: "Messagerie interne", group: "Reporting & Comms", href: "/messages", icon: ChatCircleText },
  { id: "notifications", label: "Notifications", group: "Reporting & Comms", href: "/notifications", icon: Bell },
  // Outils & IA
  { id: "agent-juridique", label: "Agent juridique IA", group: "Outils & IA", href: "/agent-juridique", icon: Robot, keywords: ["ia", "juridique", "droit"] },
  { id: "calculateur", label: "Simulateur paie", group: "Outils & IA", href: "/calculateur", icon: Calculator, keywords: ["simulation", "calcul"] },
  // Administration
  { id: "parametres", label: "Paramètres", group: "Administration", href: "/parametres", icon: Gear, keywords: ["settings", "config"] },
  { id: "audit", label: "Journal d'audit", group: "Administration", href: "/parametres/audit", icon: ShieldWarning },
];

// Groupement pour l'affichage
const groups = Array.from(new Set(commands.map((c) => c.group)));

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const filtered = query.trim()
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q) ||
          c.keywords?.some((k) => k.includes(q))
        );
      })
    : commands;

  const groupedFiltered = groups
    .map((g) => ({ group: g, items: filtered.filter((c) => c.group === g) }))
    .filter((g) => g.items.length > 0);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[oklch(0.155_0.030_248)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col" shouldFilter={false}>
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700/60">
            <MagnifyingGlass className="h-4 w-4 shrink-0 text-slate-400" weight="bold" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Rechercher une page, un module…"
              autoFocus
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[420px] overflow-y-auto p-2 space-y-1">
            <Command.Empty className="py-10 text-center text-sm text-slate-400">
              Aucun résultat pour « {query} »
            </Command.Empty>

            {groupedFiltered.map(({ group, items }) => (
              <Command.Group key={group} className="">
                <div className="px-2 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    {group}
                  </span>
                </div>
                {items.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={cmd.id}
                      onSelect={() => navigate(cmd.href)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer outline-none aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors"
                    >
                      <Icon
                        weight="duotone"
                        className="h-4 w-4 shrink-0 text-slate-400 aria-selected:text-indigo-500"
                      />
                      <span className="flex-1 font-medium">{cmd.label}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">
                        {cmd.group}
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-slate-700/60 px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-5 items-center rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-1 font-mono text-[10px] text-slate-500">↑↓</kbd>
                naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-5 items-center rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-1 font-mono text-[10px] text-slate-500">↵</kbd>
                ouvrir
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-1 font-mono text-[10px] text-slate-500">
                ⌘K
              </kbd>
              {" "}pour ouvrir
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

// Bouton déclencheur dans la topbar
export function CommandPaletteButton() {
  return (
    <button
      onClick={() => {
        const event = new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
          ctrlKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      }}
      className="hidden sm:flex items-center gap-2 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      title="Recherche rapide (Ctrl+K)"
    >
      <MagnifyingGlass className="h-3.5 w-3.5" weight="bold" />
      <span>Recherche…</span>
      <kbd className="ml-1 hidden md:inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-1 font-mono text-[10px]">
        ⌘K
      </kbd>
    </button>
  );
}
