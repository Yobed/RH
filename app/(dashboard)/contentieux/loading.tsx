import { SkeletonTable, SkeletonKpiRow } from "@/components/ui/skeleton-table";

export default function ContentieuxLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-44 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-60 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-36 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
      </div>

      {/* KPI contentieux (en cours, tribunal, réglés, risque financier) */}
      <SkeletonKpiRow count={4} />

      {/* Alerte dossiers urgents */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="h-5 w-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full max-w-xl bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-full max-w-lg bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-full max-w-md bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
      </div>

      {/* Tableau des dossiers */}
      <div>
        <div className="h-5 w-44 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-3" />
        <SkeletonTable rows={8} columns={6} />
      </div>
    </div>
  );
}
