import { SkeletonTable, SkeletonKpiRow, SkeletonCard } from "@/components/ui/skeleton-table";

export default function CongesLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-40 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
      </div>

      {/* KPI Skeleton */}
      <SkeletonKpiRow count={3} />

      {/* Rappel légal Skeleton */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="h-5 w-64 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-4" />
        <div className="flex flex-wrap gap-4">
          <div className="h-4 w-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
      </div>

      {/* Note arrêts maladie Skeleton */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="h-5 w-64 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-2" />
        <div className="h-4 w-full max-w-2xl bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
      </div>

      {/* Table 1 Skeleton */}
      <div>
        <div className="h-5 w-64 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-3" />
        <SkeletonTable rows={3} columns={5} />
      </div>

      {/* Table 2 Skeleton */}
      <div>
        <div className="h-5 w-64 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-3" />
        <SkeletonTable rows={3} columns={5} />
      </div>

      {/* Table 3 Skeleton */}
      <div>
        <div className="h-5 w-40 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mb-3" />
        <SkeletonTable rows={5} columns={5} />
      </div>
    </div>
  );
}
