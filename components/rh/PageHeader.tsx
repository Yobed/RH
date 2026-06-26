import { cn } from "@/lib/utils";
import { PageHelp } from "./PageHelp";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Texte d'aide en langage clair (rôle de la page + contexte légal) → bulle « ? » */
  help?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, help, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1
            className="text-2xl font-bold tracking-tight text-foreground truncate"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            {title}
          </h1>
          {help && <PageHelp text={help} />}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
