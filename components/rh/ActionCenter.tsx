import Link from "next/link";
import {
  CalendarCheck,
  FileWarning,
  Clock,
  HeartPulse,
  ClipboardList,
  Scale,
  CheckCircle2,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

export type ActionType =
  | "conges"
  | "cdd"
  | "essai"
  | "medical"
  | "evaluation"
  | "contentieux";

export interface ActionItem {
  type: ActionType;
  count: number;
}

type Priority = "haute" | "moyenne" | "basse";
type Category = "Urgence" | "Opérationnel" | "Analyse";

interface ActionConfig {
  label: (n: number) => string;
  href: string;
  cta: string;
  icon: LucideIcon;
  priority: Priority;
  category: Category;
}

const CONFIG: Record<ActionType, ActionConfig> = {
  contentieux: {
    label: (n) => `${n} contentieux RH ouvert${n > 1 ? "s" : ""} à régulariser`,
    href: "/contentieux",
    cta: "Traiter",
    icon: Scale,
    priority: "haute",
    category: "Urgence",
  },
  cdd: {
    label: (n) => `${n} CDD arrive${n > 1 ? "nt" : ""} à échéance (< 30 j)`,
    href: "/contrats",
    cta: "Consulter",
    icon: FileWarning,
    priority: "haute",
    category: "Urgence",
  },
  conges: {
    label: (n) => `${n} demande${n > 1 ? "s" : ""} de congé en attente d'arbitrage`,
    href: "/conges",
    cta: "Valider",
    icon: CalendarCheck,
    priority: "haute",
    category: "Opérationnel",
  },
  essai: {
    label: (n) => `${n} période${n > 1 ? "s" : ""} d'essai s'achève${n > 1 ? "nt" : ""} (< 30 j)`,
    href: "/contrats",
    cta: "Décider",
    icon: Clock,
    priority: "moyenne",
    category: "Opérationnel",
  },
  medical: {
    label: (n) => `${n} visite${n > 1 ? "s" : ""} médicale${n > 1 ? "s" : ""} à planifier`,
    href: "/medical",
    cta: "Planifier",
    icon: HeartPulse,
    priority: "moyenne",
    category: "Analyse",
  },
  evaluation: {
    label: (n) => `${n} évaluation${n > 1 ? "s" : ""} annuelle${n > 1 ? "s" : ""} en brouillon`,
    href: "/evaluations",
    cta: "Finaliser",
    icon: ClipboardList,
    priority: "basse",
    category: "Analyse",
  },
};

const PRIORITY_ORDER: Record<Priority, number> = { haute: 0, moyenne: 1, basse: 2 };

const ICON_STYLES: Record<Priority, string> = {
  haute: "bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400",
  moyenne: "bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400",
  basse: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
};

const CATEGORY_BADGE: Record<Category, string> = {
  Urgence: "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400 font-medium",
  Opérationnel: "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400 font-medium",
  Analyse: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 font-medium",
};

export function ActionCenter({ items }: { items: ActionItem[] }) {
  const actionable = items
    .filter((i) => i.count > 0)
    .sort((a, b) => PRIORITY_ORDER[CONFIG[a.type].priority] - PRIORITY_ORDER[CONFIG[b.type].priority]);

  const total = actionable.reduce((sum, i) => sum + i.count, 0);

  if (actionable.length === 0) {
    return (
      <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">Centre d'Action Dégagé</h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            Toutes les tâches prioritaires sont traitées à jour.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      {/* En-tête Épuré Executive */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-600" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Actions & Décisions Prioritaires
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tâches nécessitant une validation RH immédiate
            </p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          {total} à traiter
        </span>
      </div>

      {/* Liste Épurée des Actions */}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {actionable.map((item) => {
          const cfg = CONFIG[item.type];
          const Icon = cfg.icon;
          return (
            <li key={item.type}>
              <Link
                href={cfg.href}
                className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${ICON_STYLES[cfg.priority]}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1 flex items-center gap-2.5 flex-wrap">
                    <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {cfg.label(item.count)}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${CATEGORY_BADGE[cfg.category]}`}>
                      {cfg.category}
                    </span>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {cfg.cta}
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
