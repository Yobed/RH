import { cn } from "@/lib/utils"
import { PageShell } from "@/components/ui/page-shell"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-800", className)}
      {...props}
    />
  )
}

// Squelette de page standard (en-tête + KPI + contenu) — pour les loading.tsx.
function PageSkeleton({
  kpis = 4,
  rows = 6,
  variant = "table",
}: {
  kpis?: number
  rows?: number
  variant?: "table" | "cards"
}) {
  return (
    <PageShell>
      <div className="flex flex-col gap-3 border-b border-slate-200/70 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-7 w-64" />
        </div>
        <Skeleton className="h-9 w-40 rounded-xl" />
      </div>

      {kpis > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: kpis }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {variant === "table" ? (
        <div className="space-y-px overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800">
          <Skeleton className="h-11 rounded-none" />
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-none opacity-70" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      )}
    </PageShell>
  )
}

export { Skeleton, PageSkeleton }
