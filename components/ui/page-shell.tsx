import { PageHelp } from "@/components/rh/PageHelp";
import { cn } from "@/lib/utils";

// Gabarit de page unique : padding + largeur max homogènes sur tout le dashboard.
// Évite que le contenu « saute » d'une page à l'autre (cf. audit mise en page).
export function PageShell({
  children,
  className,
  width = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  // "wide" : tableaux/dashboards (1600px). "narrow" : formulaires & lecture (max-w-4xl).
  width?: "wide" | "narrow";
}) {
  const maxW = width === "narrow" ? "max-w-4xl" : "max-w-[1600px]";
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 md:px-8 space-y-6", maxW, className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  // Petit libellé contextuel au-dessus du titre (ex. « Effectif RH »).
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  help?: string;
  // Grappe d'actions à droite. Le CTA primaire doit être le dernier élément.
  actions?: React.ReactNode;
}

// En-tête de page standard : une seule hiérarchie typographique pour toutes les pages.
export function PageHeader({ eyebrow, eyebrowIcon, title, description, help, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {(eyebrow || help) && (
          <div className="mb-1 flex items-center gap-2">
            {eyebrow && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {eyebrowIcon}
                {eyebrow}
              </span>
            )}
            {help && <PageHelp text={help} />}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
