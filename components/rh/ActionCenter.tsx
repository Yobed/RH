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

const TINT: Record<Priority, string> = {
  haute: "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-400",
  moyenne: "bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:bg-amber-950/50 dark:border-amber-800/60 dark:text-amber-400",
  basse: "bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:bg-sky-950/50 dark:border-sky-800/60 dark:text-sky-400",
};

const CATEGORY_BADGE: Record<Category, string> = {
  Urgence: "bg-rose-600 text-white shadow-xs font-bold",
  Opérationnel: "bg-amber-600 text-white shadow-xs font-bold",
  Analyse: "bg-sky-600 text-white shadow-xs font-bold",
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
          <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">Centre d'Action Dégagé</h4>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
            Tout est parfaitement à jour — aucune action urgente en attente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-slate-300/90 dark:border-slate-700 bg-white shadow-2xl shadow-slate-300/40 dark:bg-slate-900 dark:shadow-none transition-all duration-300">
      {/* En-tête Studio RH Prioritaire Amplifié */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-6 py-4.5 dark:border-slate-800 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-orange-500/10 dark:from-slate-800 dark:to-slate-900 border-t-4 border-t-[#FF8200] gap-3">
        <div className="flex items-center gap-3.5">
          <div className="flex h-3.5 w-3.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Flux RH Intelligents — Décisions Prioritaires
              </h2>
              <span className="rounded-full bg-[#FF8200] text-white px-2.5 py-0.5 text-xs font-bold shadow-xs">
                {total} à traiter
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              Actions directes ordonnées par Urgence, Opérationnel et Analyse
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            ⚡ Hub Ultra-Décisionnel
          </span>
        </div>
      </div>

      {/* Liste des Actions */}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {actionable.map((item, index) => {
          const cfg = CONFIG[item.type];
          const Icon = cfg.icon;
          const isTop3 = index < 3;
          return (
            <li key={item.type} className={isTop3 ? "bg-slate-50/50 dark:bg-slate-800/30" : ""}>
              <Link
                href={cfg.href}
                className="group flex items-center justify-between gap-4 px-6 py-4 outline-none transition-all hover:bg-orange-50/60 focus-visible:bg-slate-50 dark:hover:bg-slate-800/80"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Badge d'Ordre Décisionnel Top 3 */}
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xs transition-transform group-hover:scale-105 relative ${TINT[cfg.priority]}`}>
                    <Icon className="h-5.5 w-5.5 stroke-[2.25]" />
                    {isTop3 && (
                      <span className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full bg-[#FF8200] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                        #{index + 1}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#FF8200] transition-colors">
                        {cfg.label(item.count)}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md ${CATEGORY_BADGE[cfg.category]}`}>
                        {cfg.category}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#FF8200] hover:bg-[#E07400] px-4.5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-[#FF8200]/20 group-hover:scale-105 active:scale-95">
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
