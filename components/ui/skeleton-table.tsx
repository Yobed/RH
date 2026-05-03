"use client";

import { cn } from "@/lib/utils";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-slate-200/60 dark:bg-slate-700/40 shimmer",
        className
      )}
    />
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonPulse key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex items-center gap-4 px-4 py-4 border-b border-slate-50 dark:border-slate-800/50 last:border-b-0"
          style={{ animationDelay: `${row * 80}ms` }}
        >
          {Array.from({ length: columns }).map((_, col) => (
            <SkeletonPulse
              key={col}
              className={cn(
                "h-3",
                col === 0 ? "w-32" : "flex-1",
                col === columns - 1 ? "w-20" : ""
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] space-y-3", className)}>
      <SkeletonPulse className="h-2.5 w-24" />
      <SkeletonPulse className="h-7 w-32" />
      <SkeletonPulse className="h-2.5 w-40" />
    </div>
  );
}

export function SkeletonKpiRow({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
