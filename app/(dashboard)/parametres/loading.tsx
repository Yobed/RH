import { SkeletonCard } from "@/components/ui/skeleton-table";

export default function ParametresLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="h-8 w-44 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        <div className="h-4 w-60 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer mt-2" />
      </div>

      {/* Onglets de navigation paramètres */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        ))}
      </div>

      {/* Section entreprise */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="h-6 w-40 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-28 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
              <div className="h-10 w-full bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
            </div>
          ))}
        </div>
        <div className="h-10 w-28 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
      </div>

      {/* Section utilisateurs / accès */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
          <div className="h-10 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="h-9 w-9 rounded-full bg-slate-200/60 dark:bg-slate-700/40 shimmer shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-36 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
                <div className="h-3 w-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
              </div>
              <div className="h-6 w-20 bg-slate-200/60 dark:bg-slate-700/40 rounded-full shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Section notifications */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="h-6 w-44 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-48 bg-slate-200/60 dark:bg-slate-700/40 rounded-md shimmer" />
              <div className="h-6 w-12 bg-slate-200/60 dark:bg-slate-700/40 rounded-full shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
