import { SkeletonTable } from "@/components/ui/skeleton-table";

export default function EmployesLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6 bg-transparent">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="h-8 w-40 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-4 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mt-2" />
          {/* Mini KPIs inline skeleton */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="h-4 w-20 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
            <div className="h-4 w-20 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
            <div className="h-4 w-20 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
      </div>

      <SkeletonTable rows={10} columns={7} />
    </div>
  );
}
