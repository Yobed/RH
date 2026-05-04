import { SkeletonTable, SkeletonKpiRow } from "@/components/ui/skeleton-table";

export default function RappelsLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-40 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-56 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-36 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
      </div>

      {/* KPI rappels (en attente, urgents, à venir, résolus) */}
      <SkeletonKpiRow count={4} />

      {/* Rappels urgents du jour */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="h-5 w-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-slate-200/60 dark:bg-slate-700/40 shimmer shrink-0" />
              <div className="h-4 w-full max-w-sm bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
              <div className="h-4 w-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer shrink-0 ml-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Filtres type / statut */}
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
      </div>

      {/* Tableau de tous les rappels */}
      <div>
        <div className="h-5 w-44 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-3" />
        <SkeletonTable rows={8} columns={5} />
      </div>
    </div>
  );
}
