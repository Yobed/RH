import Link from "next/link";
import {
  CalendarCheck,
  FileWarning,
  Clock,
  HeartPulse,
  ClipboardList,
  Scale,
  CheckCircle2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Centre « À traiter » — agrège toutes les actions RH en attente en UNE liste
// priorisée et actionnable. Réduit la charge mentale : l'utilisateur voit d'un
// coup ce qui demande son attention, sans explorer chaque page.
// La page passe juste des { type, count } ; ce composant gère libellés, ordre,
// priorité, icône et bouton.
// ─────────────────────────────────────────────────────────────────────────────

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

interface ActionConfig {
  label: (n: number) => string;
  href: string;
  cta: string;
  icon: LucideIcon;
  priority: Priority;
}

const CONFIG: Record<ActionType, ActionConfig> = {
  conges: {
    label: (n) => `${n} demande${n > 1 ? "s" : ""} de congé à valider`,
    href: "/conges",
    cta: "Valider",
    icon: CalendarCheck,
    priority: "haute",
  },
  contentieux: {
    label: (n) => `${n} contentieux ouvert${n > 1 ? "s" : ""}`,
    href: "/contentieux",
    cta: "Traiter",
    icon: Scale,
    priority: "haute",
  },
  cdd: {
    label: (n) => `${n} CDD arrive${n > 1 ? "nt" : ""} à échéance (< 30 j)`,
    href: "/contrats",
    cta: "Voir",
    icon: FileWarning,
    priority: "haute",
  },
  essai: {
    label: (n) => `${n} période${n > 1 ? "s" : ""} d'essai s'achève${n > 1 ? "nt" : ""} (< 30 j)`,
    href: "/contrats",
    cta: "Décider",
    icon: Clock,
    priority: "moyenne",
  },
  medical: {
    label: (n) => `${n} visite${n > 1 ? "s" : ""} médicale${n > 1 ? "s" : ""} à planifier`,
    href: "/medical",
    cta: "Planifier",
    icon: HeartPulse,
    priority: "moyenne",
  },
  evaluation: {
    label: (n) => `${n} évaluation${n > 1 ? "s" : ""} en brouillon`,
    href: "/evaluations",
    cta: "Finaliser",
    icon: ClipboardList,
    priority: "basse",
  },
};

const PRIORITY_ORDER: Record<Priority, number> = { haute: 0, moyenne: 1, basse: 2 };

const TINT: Record<Priority, string> = {
  haute: "bg-slate-50 border border-slate-200/60 text-slate-600 dark:bg-slate-850 dark:border-slate-700/60 dark:text-slate-300",
  moyenne: "bg-slate-50 border border-slate-200/60 text-slate-600 dark:bg-slate-850 dark:border-slate-700/60 dark:text-slate-300",
  basse: "bg-slate-50 border border-slate-200/60 text-slate-600 dark:bg-slate-850 dark:border-slate-700/60 dark:text-slate-300",
};

export function ActionCenter({ items }: { items: ActionItem[] }) {
  const actionable = items
    .filter((i) => i.count > 0)
    .sort((a, b) => PRIORITY_ORDER[CONFIG[a.type].priority] - PRIORITY_ORDER[CONFIG[b.type].priority]);

  const total = actionable.reduce((sum, i) => sum + i.count, 0);

  // État positif : rien à traiter
  if (actionable.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/50 px-5 py-4 dark:border-slate-850/60 dark:bg-slate-900/30">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Tout est à jour — aucune action en attente.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">À traiter</h2>
          <span className="rounded-full bg-slate-100 border border-slate-250/60 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:border-slate-700/60 dark:text-slate-300">
            {total}
          </span>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Par priorité
        </span>
      </div>

      {/* Liste */}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {actionable.map((item) => {
          const cfg = CONFIG[item.type];
          const Icon = cfg.icon;
          return (
            <li key={item.type}>
              <Link
                href={cfg.href}
                className="group flex items-center gap-3 px-5 py-3 outline-none transition-colors hover:bg-slate-50/80 focus-visible:bg-slate-50 dark:hover:bg-slate-800/40 dark:focus-visible:bg-slate-800/40"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TINT[cfg.priority]}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#FF8200] transition-colors">
                    {cfg.label(item.count)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-lg bg-[#FF8200] hover:bg-[#E06D00] px-3 py-1.5 text-xs font-bold text-white transition-colors shadow-xs">
                  {cfg.cta}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
