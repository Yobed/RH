"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────────────── */

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  key: string;
  header: string;
  /** Custom render for the cell */
  render?: (row: T) => React.ReactNode;
  /** Accessor function returning the sortable value */
  sortValue?: (row: T) => string | number | null;
  /** If false, column header is not clickable for sorting */
  sortable?: boolean;
  /** Additional classes for header */
  headerClassName?: string;
  /** Additional classes for cell */
  cellClassName?: string;
  /** Hide on mobile */
  hideMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  /** Unique key extractor */
  getRowId: (row: T) => string;
  /** Items per page, set 0 for no pagination */
  pageSize?: number;
  /** Optional row click handler */
  onRowClick?: (row: T) => void;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Additional actions for each row (render in last column) */
  rowActions?: (row: T) => React.ReactNode;
  className?: string;
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export function DataTable<T>({
  data,
  columns,
  getRowId,
  pageSize = 25,
  onRowClick,
  emptyState,
  rowActions,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);

  // Toggle sort
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDir === "asc") setSortDir("desc");
        else if (sortDir === "desc") {
          setSortKey(null);
          setSortDir(null);
        }
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPage(0);
    },
    [sortKey, sortDir]
  );

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;
    const accessor = col.sortValue;
    return [...data].sort((a, b) => {
      const va = accessor(a);
      const vb = accessor(b);
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [data, sortKey, sortDir, columns]);

  // Pagination
  const usePagination = pageSize > 0 && sortedData.length > pageSize;
  const totalPages = usePagination ? Math.ceil(sortedData.length / pageSize) : 1;
  const pageData = usePagination
    ? sortedData.slice(page * pageSize, (page + 1) * pageSize)
    : sortedData;

  const hasActions = !!rowActions;

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[oklch(0.155_0.030_248)] overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 dark:bg-[oklch(0.135_0.026_248/0.6)] border-b border-slate-100 dark:border-slate-800">
              <tr>
                {columns.map((col) => {
                  const isSortable = col.sortable !== false && !!col.sortValue;
                  const isActive = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400",
                        isSortable && "cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200 transition-colors group",
                        col.hideMobile && "hidden md:table-cell",
                        col.headerClassName
                      )}
                      onClick={isSortable ? () => handleSort(col.key) : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.header}
                        {isSortable && (
                          <span className="inline-flex">
                            {isActive && sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3 text-slate-800 dark:text-slate-200" />
                            ) : isActive && sortDir === "desc" ? (
                              <ChevronDown className="h-3 w-3 text-slate-800 dark:text-slate-200" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                            )}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
                {hasActions && (
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400 w-12" />
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {pageData.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={cn(
                    "hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-sm",
                        col.hideMobile && "hidden md:table-cell",
                        col.cellClassName
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {rowActions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination bar */}
      {usePagination && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sortedData.length)} sur {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-400 px-2 tabular-nums font-medium">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
