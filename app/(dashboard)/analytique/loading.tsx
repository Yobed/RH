import { SkeletonTable, SkeletonKpiRow } from "@/components/ui/skeleton-table";

export default function AnalytiqueLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="h-8 w-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-64 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-10 w-28 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
      </div>

      {/* KPI cards — 6 indicateurs RH */}
      <SkeletonKpiRow count={6} />

      {/* Graphe principal */}
      <div className="h-56 w-full rounded-2xl bg-slate-200/60 dark:bg-slate-700/40 shimmer" />

      {/* Deux graphes secondaires côte à côte */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-40 rounded-2xl bg-slate-200/60 dark:bg-slate-700/40 shimmer" />
        <div className="h-40 rounded-2xl bg-slate-200/60 dark:bg-slate-700/40 shimmer" />
      </div>

      {/* Tableau récapitulatif */}
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}
