import { SkeletonTable, SkeletonKpiRow, SkeletonCard } from "@/components/ui/skeleton-table";

export default function RecrutementLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-44 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-56 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-10 w-36 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
      </div>

      {/* KPI pipeline */}
      <SkeletonKpiRow count={4} />

      {/* Pipeline kanban — cartes par étape */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
            <div className="h-4 w-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ))}
      </div>

      {/* Tableau des candidatures récentes */}
      <div>
        <div className="h-5 w-52 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-3" />
        <SkeletonTable rows={6} columns={5} />
      </div>
    </div>
  );
}
