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
  haute: "bg-rose-50/80 border border-rose-200/70 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800/50 dark:text-rose-400",
  moyenne: "bg-amber-50/80 border border-amber-200/70 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800/50 dark:text-amber-400",
  basse: "bg-sky-50/80 border border-sky-200/70 text-sky-600 dark:bg-sky-950/40 dark:border-sky-800/50 dark:text-sky-400",
};

const BADGE_TINT: Record<Priority, string> = {
  haute: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  moyenne: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  basse: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export function ActionCenter({ items }: { items: ActionItem[] }) {
  const actionable = items
    .filter((i) => i.count > 0)
    .sort((a, b) => PRIORITY_ORDER[CONFIG[a.type].priority] - PRIORITY_ORDER[CONFIG[b.type].priority]);

  const total = actionable.reduce((sum, i) => sum + i.count, 0);

  // État positif : rien à traiter
  if (actionable.length === 0) {
    return (
      <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-200/60 bg-emerald-50/40 px-5 py-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        </div>
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
          Tout est à jour — aucune action urgente en attente.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-100/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none transition-all">
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800/80 bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-800/40 dark:to-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8200] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF8200]"></span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">À traiter en priorité</h2>
          <span className="rounded-full bg-[#FF8200]/10 border border-[#FF8200]/20 px-2.5 py-0.5 text-xs font-extrabold text-[#FF8200]">
            {total}
          </span>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Actions RH requises
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
                className="group flex items-center justify-between gap-4 px-6 py-4 outline-none transition-all hover:bg-slate-50/80 focus-visible:bg-slate-50 dark:hover:bg-slate-800/40 dark:focus-visible:bg-slate-800/40"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-xs ${TINT[cfg.priority]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#FF8200] transition-colors">
                        {cfg.label(item.count)}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${BADGE_TINT[cfg.priority]}`}>
                        {cfg.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#FF8200] hover:bg-[#E06D00] px-4 py-2 text-xs font-bold text-white transition-all shadow-md shadow-[#FF8200]/20 group-hover:scale-[1.03] active:scale-[0.98]">
                  {cfg.cta}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
