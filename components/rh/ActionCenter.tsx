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
    cta: "Consulter",
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
  haute: "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-400",
  moyenne: "bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:bg-amber-950/50 dark:border-amber-800/60 dark:text-amber-400",
  basse: "bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:bg-sky-950/50 dark:border-sky-800/60 dark:text-sky-400",
};

const BADGE_TINT: Record<Priority, string> = {
  haute: "bg-rose-100 text-rose-800 font-black dark:bg-rose-900/60 dark:text-rose-200",
  moyenne: "bg-amber-100 text-amber-800 font-black dark:bg-amber-900/60 dark:text-amber-200",
  basse: "bg-slate-100 text-slate-700 font-black dark:bg-slate-800 dark:text-slate-300",
};

export function ActionCenter({ items }: { items: ActionItem[] }) {
  const actionable = items
    .filter((i) => i.count > 0)
    .sort((a, b) => PRIORITY_ORDER[CONFIG[a.type].priority] - PRIORITY_ORDER[CONFIG[b.type].priority]);

  const total = actionable.reduce((sum, i) => sum + i.count, 0);

  // État positif : rien à traiter
  if (actionable.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-3xl border-2 border-emerald-300 bg-emerald-50/70 p-5 dark:border-emerald-900/70 dark:bg-emerald-950/40 shadow-md">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
        </div>
        <div>
          <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-200">Centre d'Action Dégagé</h4>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
            Tout est parfaitement à jour — aucune action urgente en attente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-slate-300/80 dark:border-slate-700 bg-white shadow-2xl shadow-slate-300/40 dark:bg-slate-900 dark:shadow-none transition-all duration-300">
      {/* En-tête Studio RH Prioritaire */}
      <div className="relative flex items-center justify-between border-b border-slate-200 px-6 py-4.5 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-white to-orange-500/10 dark:from-slate-800 dark:to-slate-900 border-t-4 border-t-[#FF8200]">
        <div className="flex items-center gap-3.5">
          <div className="flex h-3.5 w-3.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8200] opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FF8200]" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>À Traiter en Priorité</span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-md shadow-xs">
              Urgent
            </span>
          </h2>
          <span className="rounded-full bg-[#FF8200] text-white px-3 py-0.5 text-xs font-black shadow-xs">
            {total} dossier{total > 1 ? "s" : ""}
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Flux RH Intelligents
        </span>
      </div>

      {/* Liste */}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {actionable.map((item) => {
          const cfg = CONFIG[item.type];
          const Icon = cfg.icon;
          return (
            <li key={item.type}>
              <Link
                href={cfg.href}
                className="group flex items-center justify-between gap-4 px-6 py-4 outline-none transition-all hover:bg-orange-50/50 focus-visible:bg-slate-50 dark:hover:bg-slate-800/60 dark:focus-visible:bg-slate-800/60"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xs transition-transform group-hover:scale-105 ${TINT[cfg.priority]}`}
                  >
                    <Icon className="h-5.5 w-5.5 stroke-[2.25]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="truncate text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-[#FF8200] transition-colors">
                        {cfg.label(item.count)}
                      </span>
                      <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full ${BADGE_TINT[cfg.priority]}`}>
                        {cfg.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#FF8200] hover:bg-[#E07400] px-4.5 py-2 text-xs font-black text-white transition-all shadow-md shadow-[#FF8200]/20 group-hover:scale-105 active:scale-95">
                  {cfg.cta}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
