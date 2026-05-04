import { SkeletonTable, SkeletonKpiRow } from "@/components/ui/skeleton-table";

export default function ReportingLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-40 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-60 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-10 w-36 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        <div className="h-10 w-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
      </div>

      {/* KPI rapport */}
      <SkeletonKpiRow count={5} />

      {/* Graphe masse salariale */}
      <div className="h-52 w-full rounded-2xl bg-slate-200/60 dark:bg-slate-700/40 shimmer" />

      {/* Deux graphes secondaires */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-40 rounded-2xl bg-slate-200/60 dark:bg-slate-700/40 shimmer" />
        <div className="h-40 rounded-2xl bg-slate-200/60 dark:bg-slate-700/40 shimmer" />
      </div>

      {/* Tableau synthèse CNPS / DGI */}
      <div>
        <div className="h-5 w-52 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-3" />
        <SkeletonTable rows={6} columns={6} />
      </div>
    </div>
  );
}
