import { SkeletonTable, SkeletonKpiRow } from "@/components/ui/skeleton-table";

export default function DocumentsRhLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-64 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-10 w-36 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
      </div>

      {/* KPI documents */}
      <SkeletonKpiRow count={3} />

      {/* Barre de recherche + filtres */}
      <div className="flex gap-2">
        <div className="h-10 flex-1 max-w-sm bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
      </div>

      {/* Grille de catégories de documents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
            <div className="h-8 w-8 rounded-lg bg-slate-200/60 dark:bg-slate-700/40 shimmer" />
            <div className="h-4 w-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
            <div className="h-3 w-16 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          </div>
        ))}
      </div>

      {/* Tableau des documents récents */}
      <div>
        <div className="h-5 w-44 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-3" />
        <SkeletonTable rows={6} columns={5} />
      </div>
    </div>
  );
}
