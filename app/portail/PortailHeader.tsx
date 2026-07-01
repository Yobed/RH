// En-tête de sous-page du portail salarié — cohérent, accent aubergine.
// L'accueil garde son grand héro ; les sous-pages partagent cet en-tête léger.

export function PortailHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ee7f03]/10 text-[#ee7f03]">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[13px] leading-snug text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
