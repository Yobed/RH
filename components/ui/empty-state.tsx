"use client";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const defaultIllustration = (
  <svg
    className="mx-auto h-24 w-24 text-slate-300 dark:text-slate-600"
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="20" y="32" width="88" height="72" rx="8" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" />
    <circle cx="64" cy="56" r="12" stroke="currentColor" strokeWidth="2" />
    <path d="M52 56l8 8 12-16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    <rect x="40" y="78" width="48" height="4" rx="2" fill="currentColor" opacity="0.2" />
    <rect x="48" y="86" width="32" height="4" rx="2" fill="currentColor" opacity="0.12" />
  </svg>
);

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20 py-12 px-6 text-center transition-colors",
        className
      )}
    >
      <div className="mb-4 animate-[fadeIn_0.3s_ease-out]">
        {icon ?? defaultIllustration}
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
