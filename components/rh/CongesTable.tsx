"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretUp, CaretDown, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { CongesApprovalButton } from "@/components/rh/CongesApprovalButton";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar as CalendarIcon, Paperclip } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  annuel: "Congé annuel",
  maladie: "Maladie",
  arret_maladie: "Arrêt maladie",
  maternite: "Maternité",
  paternite: "Paternité",
  sans_solde: "Sans solde",
  exceptionnel: "Exceptionnel",
};

type StatutKey = "en_attente" | "valide_manager" | "approuve" | "refuse";

const statutConfig: Record<StatutKey, { label: string; dot: string }> = {
  en_attente: {
    label: "En attente",
    dot: "bg-slate-400",
  },
  valide_manager: {
    label: "Validé manager",
    dot: "bg-slate-400",
  },
  approuve: {
    label: "Approuvé",
    dot: "bg-slate-400",
  },
  refuse: {
    label: "Refusé",
    dot: "bg-slate-300",
  },
};

function formatDate(d: string) {
  if (!d) return "";
  try {
    const parts = d.split("T")[0].split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(y, m, day).toLocaleDateString("fr-CI", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  } catch {}
  return new Date(d).toLocaleDateString("fr-CI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatutBadge({ statut }: { statut: string }) {
  const key = (statut ?? "en_attente") as StatutKey;
  const cfg = statutConfig[key] ?? statutConfig.en_attente;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600"
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

const ArretBadge = ({ estAt, estJustifie }: { estAt?: boolean; estJustifie?: boolean }) => {
  if (estAt) {
    return (
      <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-[#2563eb] mr-1.5" />
        Accident Travail
      </span>
    );
  }
  if (estJustifie) {
    return (
      <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-slate-400 mr-1.5" />
        Justifié
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-slate-300 mr-1.5" />
      Non justifié
    </span>
  );
};

export type CongeRow = {
  id: string;
  type: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  statut: string | null;
  commentaire: string | null;
  refus_motif: string | null;
  created_at: string;
  est_justifie: boolean | null;
  est_at: boolean | null;
  justificatif_url: string | null;
  employees: { full_name: string; matricule: string } | { full_name: string; matricule: string }[] | null;
};

export function CongesTable({ conges, showActions, canManagerApprove, canRhApprove, serverPaginated = false, totalCount = 0 }: {
  conges: CongeRow[];
  showActions: boolean;
  canManagerApprove: boolean;
  canRhApprove: boolean;
  serverPaginated?: boolean;
  totalCount?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [clientSortColumn, setClientSortColumn] = useState<string>("");
  const [clientSortDir, setClientSortDir] = useState<"asc" | "desc">("asc");
  const [clientCurrentPage, setClientCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const sortColumn = serverPaginated ? (searchParams.get("sort") || "") : clientSortColumn;
  const sortDir = serverPaginated ? (searchParams.get("dir") || "asc") : clientSortDir;
  const currentPage = serverPaginated ? parseInt(searchParams.get("page") || "1", 10) : clientCurrentPage;

  const sorted = useMemo(() => {
    if (serverPaginated) return conges; // Do not sort client-side if serverPaginated
    if (!clientSortColumn) return conges;
    return [...conges].sort((a, b) => {
      let aVal: any = a[clientSortColumn as keyof CongeRow];
      let bVal: any = b[clientSortColumn as keyof CongeRow];

      if (clientSortColumn === "full_name") {
        const empA = Array.isArray(a.employees) ? a.employees[0] : a.employees;
        const empB = Array.isArray(b.employees) ? b.employees[0] : b.employees;
        aVal = empA?.full_name ?? "";
        bVal = empB?.full_name ?? "";
      } else if (clientSortColumn === "type") {
        aVal = TYPE_LABELS[a.type] ?? a.type;
        bVal = TYPE_LABELS[b.type] ?? b.type;
      } else if (clientSortColumn === "date_debut") {
        aVal = new Date(a.date_debut).getTime();
        bVal = new Date(b.date_debut).getTime();
      }

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal > bVal ? 1 : -1;
      return clientSortDir === "asc" ? comparison : -comparison;
    });
  }, [conges, clientSortColumn, clientSortDir, serverPaginated]);

  const paginated = useMemo(() => {
    if (serverPaginated) return conges; // Do not slice if serverPaginated
    const start = (clientCurrentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, clientCurrentPage, serverPaginated, conges]);

  const totalPages = serverPaginated 
    ? Math.max(1, Math.ceil(totalCount / itemsPerPage)) 
    : Math.max(1, Math.ceil(sorted.length / itemsPerPage));

  useEffect(() => {
    if (!serverPaginated) setClientCurrentPage(1);
  }, [conges, serverPaginated]);

  const handleSort = (col: string) => {
    if (serverPaginated) {
      const params = new URLSearchParams(searchParams.toString());
      if (sortColumn === col) {
        params.set("dir", sortDir === "asc" ? "desc" : "asc");
      } else {
        params.set("sort", col);
        params.set("dir", "asc");
      }
      params.set("page", "1");
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    } else {
      if (clientSortColumn === col) {
        setClientSortDir(clientSortDir === "asc" ? "desc" : "asc");
      } else {
        setClientSortColumn(col);
        setClientSortDir("asc");
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (serverPaginated) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    } else {
      setClientCurrentPage(page);
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <CaretDown className="opacity-20 ml-1 inline" size={12} />;
    return sortDir === "asc" ? (
      <CaretUp className="opacity-100 ml-1 inline text-slate-900" size={12} weight="bold" />
    ) : (
      <CaretDown className="opacity-100 ml-1 inline text-slate-900" size={12} weight="bold" />
    );
  };

  if (conges.length === 0) {
    return (
      <EmptyState
        icon={<CalendarIcon className="h-14 w-14 text-slate-300" weight="duotone" />}
        title="Aucune demande de congé"
        description="Il n'y a actuellement aucune demande de congé à afficher pour cette sélection."
      />
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] ${isPending ? 'opacity-60 pointer-events-none' : ''} transition-opacity duration-200`}>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/60 border-b border-slate-100">
          <tr>
            <th 
              className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 cursor-pointer hover:text-slate-900 transition-colors"
              onClick={() => handleSort("full_name")}
            >
              Employé <SortIcon column="full_name" />
            </th>
            <th 
              className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 cursor-pointer hover:text-slate-900 transition-colors"
              onClick={() => handleSort("type")}
            >
              Type <SortIcon column="type" />
            </th>
            <th 
              className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden md:table-cell cursor-pointer hover:text-slate-900 transition-colors"
              onClick={() => handleSort("date_debut")}
            >
              Période <SortIcon column="date_debut" />
            </th>
            <th 
              className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600 cursor-pointer hover:text-slate-900 transition-colors"
              onClick={() => handleSort("nb_jours")}
            >
              Jours <SortIcon column="nb_jours" />
            </th>
            {showActions ? (
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Actions</th>
            ) : (
              <th 
                className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 cursor-pointer hover:text-slate-900 transition-colors"
                onClick={() => handleSort("statut")}
              >
                Statut <SortIcon column="statut" />
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {paginated.map((c) => {
            const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
            return (
              <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 text-sm">
                  <p className="font-semibold text-slate-800">{emp?.full_name ?? "—"}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{emp?.matricule}</p>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-700">{TYPE_LABELS[c.type] ?? c.type}</span>
                    {c.type === "arret_maladie" && (
                      <ArretBadge
                        estAt={(c as { est_at?: boolean }).est_at ?? false}
                        estJustifie={(c as { est_justifie?: boolean }).est_justifie ?? false}
                      />
                    )}
                    {c.justificatif_url && (
                      <a
                        href={c.justificatif_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        title="Voir le justificatif"
                      >
                        <Paperclip className="h-3 w-3" />
                        Justificatif
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell text-xs">
                  {formatDate(c.date_debut)} → {formatDate(c.date_fin)}
                </td>
                <td className="px-4 py-3 text-sm text-center font-bold text-slate-800 font-mono tabular-nums">
                  {c.nb_jours}j
                </td>
                {showActions ? (
                  <td className="px-4 py-3 text-sm">
                    <CongesApprovalButton
                      congeId={c.id}
                      statut={c.statut ?? "en_attente"}
                      canManagerApprove={canManagerApprove}
                      canRhApprove={canRhApprove}
                    />
                  </td>
                ) : (
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <StatutBadge statut={c.statut ?? "en_attente"} />
                      {c.statut === "refuse" && c.refus_motif && (
                        <p className="text-xs text-slate-600 italic">{c.refus_motif}</p>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
            {serverPaginated ? totalCount : conges.length} congé{serverPaginated ? (totalCount > 1 ? 's' : '') : (conges.length > 1 ? 's' : '')}
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
