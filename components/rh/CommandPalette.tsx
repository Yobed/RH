"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  Users,
  Money,
  CalendarBlank,
  CalendarDots,
  FileText,
  ChartPieSlice,
  Scales,
  Robot,
  Gear,
  UserPlus,
  UserMinus,
  ChartLineUp,
  Archive,
  FilePdf,
  Books,
  Clock,
  Presentation,
  Student,
  FirstAid,
  ShieldWarning,
  ShieldCheck,
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
  HandWaving,
  TrendUp,
  UsersThree,
  UploadSimple,
  DeviceMobile,
  SquaresFour,
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
  { id: "dashboard", label: "Tableau de bord", group: "Vue d'ensemble", href: "/rh", icon: SquaresFour, keywords: ["accueil", "home", "dashboard"] },
  { id: "bienvenue", label: "Bienvenue", group: "Vue d'ensemble", href: "/bienvenue", icon: HandWaving, keywords: ["prise en main", "demarrer"] },
  { id: "rappels", label: "Rappels & Échéances", group: "Vue d'ensemble", href: "/rappels", icon: BellRinging, keywords: ["echeances", "alertes"] },
  { id: "calendrier", label: "Calendrier global", group: "Vue d'ensemble", href: "/calendrier", icon: CalendarDots },
  // Collaborateurs
  { id: "employes", label: "Fiches collaborateurs", group: "Collaborateurs", href: "/employes", icon: Users, keywords: ["salaries", "liste", "staff", "personnel"] },
  { id: "organigramme", label: "Organigramme", group: "Collaborateurs", href: "/employes/organigramme", icon: TreeStructure, keywords: ["hierarchie"] },
  { id: "contrats", label: "Contrats", group: "Collaborateurs", href: "/contrats", icon: FileText, keywords: ["cdi", "cdd", "avenant"] },
  { id: "conges", label: "Absences & Congés", group: "Collaborateurs", href: "/conges", icon: CalendarBlank, keywords: ["absence", "vacances", "permission"] },
  { id: "pointage", label: "Pointage", group: "Collaborateurs", href: "/pointage", icon: Clock, keywords: ["presence", "horaires"] },
  { id: "heures-sup", label: "Heures supplémentaires", group: "Collaborateurs", href: "/heures-sup", icon: Clock, keywords: ["majoration", "overtime"] },
  { id: "medical", label: "Visites médicales", group: "Collaborateurs", href: "/medical", icon: FirstAid, keywords: ["medecine du travail", "sante"] },
  { id: "onboarding", label: "Onboarding (intégration)", group: "Collaborateurs", href: "/onboarding", icon: UserPlus, keywords: ["arrivee", "integration", "accueil salarie"] },
  { id: "offboarding", label: "Offboarding (départ)", group: "Collaborateurs", href: "/offboarding", icon: UserMinus, keywords: ["depart", "sortie", "demission", "licenciement"] },
  // Planning
  { id: "planning", label: "Planning & équipes", group: "Planning", href: "/planning", icon: CalendarCheck, keywords: ["shifts", "rotation", "equipe"] },
  { id: "planning-gantt", label: "Planning par ressource", group: "Planning", href: "/planning-gantt", icon: ChartBar, keywords: ["gantt", "ressource"] },
  { id: "heatmap", label: "Carte des absences", group: "Planning", href: "/conges/heatmap", icon: CalendarBlank, keywords: ["heatmap", "chaleur"] },
  // Paie & Conformité
  { id: "paie", label: "Bulletins de paie", group: "Paie & Conformité", href: "/paie", icon: Money, keywords: ["bulletin", "salaire", "fiche de paie"] },
  { id: "lot", label: "Génération en lot", group: "Paie & Conformité", href: "/paie/generer-lot", icon: Stamp, keywords: ["paie du mois", "batch"] },
  { id: "bordereau", label: "Bordereau de virement", group: "Paie & Conformité", href: "/paie/bordereau", icon: Bank, keywords: ["virement", "banque"] },
  { id: "anomalies", label: "Anomalies de paie", group: "Paie & Conformité", href: "/paie/anomalies", icon: ShieldWarning, keywords: ["erreur", "ecart"] },
  { id: "stc", label: "Solde de tout compte (STC)", group: "Paie & Conformité", href: "/paie/fin-de-contrat", icon: FileText, keywords: ["stc", "fin de contrat", "depart"] },
  { id: "declarations", label: "Déclarations sociales", group: "Paie & Conformité", href: "/declarations", icon: Stamp, keywords: ["cnps", "dgi", "its", "fdfp", "impot"] },
  { id: "analyses", label: "Analyse masse salariale", group: "Paie & Conformité", href: "/analyses", icon: ChartBar, keywords: ["finance", "cout", "masse salariale"] },
  { id: "sage", label: "Import Sage Paie", group: "Paie & Conformité", href: "/paie/import-sage", icon: UploadSimple, keywords: ["import", "sage"] },
  // Analytique & Prévisions
  { id: "analytique", label: "Analytique RH", group: "Analytique & Prévisions", href: "/analytique", icon: ChartPieSlice, keywords: ["stats", "kpi", "indicateurs"] },
  { id: "focus", label: "Focus stratégique", group: "Analytique & Prévisions", href: "/analytique/focus", icon: Target },
  { id: "risque-depart", label: "Risque de départ", group: "Analytique & Prévisions", href: "/analytique/risque-depart", icon: UserMinus, keywords: ["turnover", "demission"] },
  { id: "prevision", label: "Prévision des effectifs", group: "Analytique & Prévisions", href: "/analytique/prevision", icon: TrendUp, keywords: ["projection", "n+1"] },
  { id: "cohortes", label: "Cohortes d'embauche", group: "Analytique & Prévisions", href: "/analytique/cohortes", icon: UsersThree },
  { id: "retraite", label: "Départs en retraite", group: "Analytique & Prévisions", href: "/analytique/retraite", icon: CalendarBlank, keywords: ["retraite"] },
  // Documents
  { id: "documents-rh", label: "Documents RH", group: "Documents", href: "/documents-rh", icon: FilePdf, keywords: ["attestation", "certificat"] },
  { id: "ged", label: "Documents numérisés (GED)", group: "Documents", href: "/ged", icon: Books, keywords: ["gestion documentaire", "coffre-fort"] },
  { id: "archives", label: "Archives", group: "Documents", href: "/archives", icon: Archive },
  // Développement RH
  { id: "recrutement", label: "Recrutement", group: "Développement RH", href: "/recrutement", icon: UserPlus, keywords: ["candidats", "offre", "embauche"] },
  { id: "evaluations", label: "Évaluations & Performance", group: "Développement RH", href: "/evaluations", icon: ChartLineUp, keywords: ["performance", "appréciation", "entretien"] },
  { id: "formation", label: "Formation & taxe FDFP", group: "Développement RH", href: "/formation", icon: Student, keywords: ["fdfp", "formation"] },
  // Qualité & Risques
  { id: "disciplinaire", label: "Procédures disciplinaires", group: "Qualité & Risques", href: "/disciplinaire", icon: ShieldWarning, keywords: ["avertissement", "sanction", "mise a pied"] },
  { id: "contentieux", label: "Contentieux", group: "Qualité & Risques", href: "/contentieux", icon: Scales, keywords: ["litige", "inspection", "prud'homme"] },
  { id: "qhse", label: "QHSE & Accidents", group: "Qualité & Risques", href: "/qhse", icon: FirstAid, keywords: ["securite", "accident", "hygiene"] },
  { id: "duerp", label: "Risques professionnels (DUERP)", group: "Qualité & Risques", href: "/duerp", icon: ShieldWarning, keywords: ["duerp", "risques"] },
  { id: "bilan-social", label: "Bilan social annuel", group: "Qualité & Risques", href: "/bilan-social", icon: Books },
  // Reporting & Comms
  { id: "reporting", label: "Reporting RH", group: "Reporting & Comms", href: "/reporting", icon: Presentation, keywords: ["rapport", "export"] },
  { id: "messages", label: "Messagerie interne", group: "Reporting & Comms", href: "/messages", icon: ChatCircleText },
  { id: "notifications", label: "Notifications", group: "Reporting & Comms", href: "/notifications", icon: Bell },
  // Outils & IA
  { id: "agent-juridique", label: "Agent juridique IA", group: "Outils & IA", href: "/agent-juridique", icon: Robot, keywords: ["ia", "juridique", "droit", "assistant"] },
  { id: "calculateur", label: "Simulateur de paie", group: "Outils & IA", href: "/calculateur", icon: Calculator, keywords: ["simulation", "calcul", "net", "brut"] },
  // Administration
  { id: "parametres", label: "Paramètres", group: "Administration", href: "/parametres", icon: Gear, keywords: ["settings", "config", "reglages"] },
  { id: "workflows", label: "Circuits d'approbation", group: "Administration", href: "/parametres/workflows", icon: ChartLineUp, keywords: ["validation", "approbation"] },
  { id: "permissions", label: "Rôles & permissions", group: "Administration", href: "/parametres/permissions", icon: UsersThree, keywords: ["rbac", "droits", "acces"] },
  { id: "securite", label: "Sécurité & 2FA", group: "Administration", href: "/parametres/securite", icon: ShieldCheck, keywords: ["mot de passe", "2fa", "authentification"] },
  { id: "audit", label: "Journal d'audit", group: "Administration", href: "/parametres/audit", icon: ShieldWarning, keywords: ["historique", "logs"] },
  { id: "mobile-money", label: "Mobile Money CI", group: "Administration", href: "/paie/mobile-money", icon: DeviceMobile, keywords: ["orange money", "wave", "mtn"] },
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
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer outline-none aria-selected:bg-teal-50 dark:aria-selected:bg-teal-900/20 aria-selected:text-teal-700 dark:aria-selected:text-teal-300 transition-colors"
                    >
                      <Icon
                        weight="duotone"
                        className="h-4 w-4 shrink-0 text-slate-400 aria-selected:text-teal-500"
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

// Barre de recherche dans la topbar — point d'entrée principal vers les ~50 pages
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
      className="hidden sm:flex items-center gap-2.5 h-9 sm:w-60 md:w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm text-slate-400 dark:text-slate-500 hover:border-teal-300 hover:text-slate-600 dark:hover:border-teal-700 dark:hover:text-slate-300 transition-colors"
      title="Rechercher une page ou un module (Ctrl+K)"
    >
      <MagnifyingGlass className="h-4 w-4 shrink-0" weight="bold" />
      <span className="flex-1 text-left truncate">Rechercher ou aller à…</span>
      <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-1.5 font-mono text-[10px]">
        ⌘K
      </kbd>
    </button>
  );
}
