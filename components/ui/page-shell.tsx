import Link from "next/link";
import { PageHelp } from "@/components/rh/PageHelp";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────
// Couche de composition partagée — direction « Swiss / pro net », accent teal.
// Tout passe par ici : changer ces blocs redessine la présentation de TOUTES
// les pages d'un coup (en-tête, surfaces, KPI, sections).
// ─────────────────────────────────────────────────────────────────────────

export function PageShell({
  children,
  className,
  width = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  // "wide" : tableaux/dashboards (1600px). "narrow" : formulaires & lecture.
  width?: "wide" | "narrow";
}) {
  const maxW = width === "narrow" ? "max-w-4xl" : "max-w-[1600px]";
  return (
    <div className={cn("mx-auto w-full px-4 py-7 sm:px-6 md:px-8 md:py-8 space-y-7", maxW, className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  help?: string;
  // Grappe d'actions à droite. Le CTA primaire = dernier élément.
  actions?: React.ReactNode;
}

// En-tête éditorial : barre d'accent teal + titre display (Jakarta) large,
// filet de séparation pleine largeur (grille suisse). Une seule hiérarchie partout.
export function PageHeader({ eyebrow, eyebrowIcon, title, description, help, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-slate-200/70 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
      <div className="relative min-w-0 pl-4">
        {/* Barre d'accent verticale teal */}
        <span
          aria-hidden
          className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-1 rounded-full bg-gradient-to-b from-[#059669] to-[#047857]"
        />
        {(eyebrow || help) && (
          <div className="mb-2 flex items-center gap-2">
            {eyebrow && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#059669]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#047857] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
                {eyebrowIcon}
                {eyebrow}
              </span>
            )}
            {help && <PageHelp text={help} />}
          </div>
        )}
        <h1 className="font-display text-[1.7rem] font-bold leading-[1.1] tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[2rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

// ── Intitulé de section : libellé + filet, pour rythmer une page (style suisse) ──
export function SectionTitle({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-[#059669]/15 bg-[#059669]/10 px-3 py-2 dark:border-[#2dd4bf]/15 dark:bg-[#2dd4bf]/10",
        className
      )}
    >
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#047857] dark:text-[#2dd4bf]">
        {children}
      </h2>
      {action}
    </div>
  );
}

// En-tête de section de formulaire surligné (bande teal) — réutilisable dans les dialogues.
export function FormSection({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 rounded-lg border border-[#059669]/15 bg-[#059669]/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#047857] dark:border-[#2dd4bf]/15 dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

type StatTone = "default" | "brand" | "success" | "warning" | "danger";

const STAT_TONES: Record<StatTone, { value: string; chip: string }> = {
  default: { value: "text-slate-900 dark:text-white", chip: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  brand: { value: "text-[#047857] dark:text-[#2dd4bf]", chip: "bg-[#059669]/10 text-[#047857] dark:text-[#2dd4bf]" },
  success: { value: "text-emerald-600 dark:text-emerald-400", chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" },
  warning: { value: "text-amber-600 dark:text-amber-400", chip: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" },
  danger: { value: "text-rose-600 dark:text-rose-400", chip: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" },
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: StatTone;
  href?: string;
  onClick?: () => void;
}

// Carte KPI éditoriale : grand chiffre (Jakarta), libellé discret, puce d'icône.
// Cliquable (href ou onClick) avec affordance hover teal.
export function StatCard({ label, value, sub, icon, tone = "default", href, onClick }: StatCardProps) {
  const t = STAT_TONES[tone];
  const interactive = !!(href || onClick);
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</span>
        {icon && (
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors", t.chip)}>
            {icon}
          </span>
        )}
      </div>
      <p className={cn("mt-3 font-display text-[1.6rem] font-bold leading-none tracking-tight tabular-nums", t.value)}>
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{sub}</p>}
    </>
  );

  const base = cn(
    "rounded-2xl border border-slate-200/70 bg-white p-5 text-left dark:border-slate-800 dark:bg-slate-900",
    interactive && "transition-all hover:border-[#059669]/40 hover:shadow-[0_8px_24px_-12px_rgba(13,148,136,0.35)] active:scale-[0.99]"
  );

  if (href) return <Link href={href} className={base}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cn(base, "w-full cursor-pointer")}>{inner}</button>;
  return <div className={base}>{inner}</div>;
}
