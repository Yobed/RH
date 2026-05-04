import { SkeletonTable, SkeletonKpiRow } from "@/components/ui/skeleton-table";

export default function EvaluationsLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-44 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-60 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-10 w-36 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
      </div>

      {/* KPI évaluations */}
      <SkeletonKpiRow count={3} />

      {/* Filtres période / département */}
      <div className="flex gap-2">
        <div className="h-10 w-36 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        <div className="h-10 w-36 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
      </div>

      {/* Graphe distribution des notes */}
      <div className="h-48 w-full rounded-2xl bg-slate-200/60 dark:bg-slate-700/40 shimmer" />

      {/* Tableau des évaluations */}
      <div>
        <div className="h-5 w-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-3" />
        <SkeletonTable rows={8} columns={6} />
      </div>
    </div>
  );
}
