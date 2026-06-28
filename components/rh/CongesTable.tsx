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

const statutConfig: Record<StatutKey, { label: string; dot: string; bg: string }> = {
  en_attente: {
    label: "En attente",
    dot: "bg-amber-500 animate-pulse",
    bg: "border-amber-200/90 bg-amber-50/80 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  },
  valide_manager: {
    label: "Validé manager",
    dot: "bg-sky-500",
    bg: "border-sky-200/90 bg-sky-50/80 text-sky-700 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300",
  },
  approuve: {
    label: "Approuvé",
    dot: "bg-emerald-500",
    bg: "border-emerald-200/90 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  refuse: {
    label: "Refusé",
    dot: "bg-rose-500",
    bg: "border-rose-200/90 bg-rose-50/80 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300",
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
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-tight transition-colors shadow-2xs",
        cfg.bg
      )}
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
        <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-[#059669] mr-1.5" />
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
  employees: { id?: string; full_name: string; matricule: string } | { id?: string; full_name: string; matricule: string }[] | null;
  solde_employe?: number;
};

function WorkflowStepper({ statut }: { statut: string }) {
  const isManagerDone = statut === "valide_manager" || statut === "approuve";
  const isRhDone = statut === "approuve";
  const isRefused = statut === "refuse";

  if (isRefused) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
        Refusé
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 text-[11px]">
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border",
          isManagerDone
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
        )}
        title={isManagerDone ? "Validé par le manager" : "En attente du manager"}
      >
        Manager {isManagerDone ? "✓" : "⏳"}
      </span>
      <span className="text-slate-300 text-[10px]">➔</span>
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border",
          isRhDone
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : isManagerDone
            ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
            : "bg-slate-50 text-slate-400 border-slate-200 opacity-60"
        )}
        title={isRhDone ? "Approuvé par les RH" : isManagerDone ? "En attente des RH" : "Attente validation manager"}
      >
        RH {isRhDone ? "✓" : isManagerDone ? "⏳" : "⚪"}
      </span>
    </div>
  );
}

function DateDepartCell({ dateDebut, dateFin, nbJours }: { dateDebut: string; dateFin: string; nbJours: number }) {
  const today = new Date().toISOString().split("T")[0];
  const isFuture = dateDebut > today;
  const isOngoing = dateDebut <= today && dateFin >= today;

  let relativeBadge = null;
  if (isOngoing) {
    relativeBadge = (
      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
        🟢 En cours
      </span>
    );
  } else if (isFuture) {
    const diffMs = new Date(dateDebut).getTime() - new Date(today).getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    relativeBadge = (
      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        🗓️ J-{diffDays}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-slate-800 text-xs">Départ : {formatDate(dateDebut)}</span>
        {relativeBadge}
      </div>
      <span className="text-[11px] text-slate-500">Retour : {formatDate(dateFin)} ({nbJours} j)</span>
    </div>
  );
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const itemsPerPage = 10;

  const sortColumn = serverPaginated ? (searchParams.get("sort") || "") : clientSortColumn;
  const sortDir = serverPaginated ? (searchParams.get("dir") || "asc") : clientSortDir;
  const currentPage = serverPaginated ? parseInt(searchParams.get("page") || "1", 10) : clientCurrentPage;

  const filteredConges = useMemo(() => {
    return conges.filter((c) => {
      const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
      const nameMatch = !searchQuery || 
        (emp?.full_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp?.matricule ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const typeMatch = filterType === "all" || c.type === filterType;
      return nameMatch && typeMatch;
    });
  }, [conges, searchQuery, filterType]);

  const sorted = useMemo(() => {
    if (serverPaginated) return filteredConges;
    if (!clientSortColumn) return filteredConges;
    return [...filteredConges].sort((a, b) => {
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
  }, [filteredConges, clientSortColumn, clientSortDir, serverPaginated]);

  const paginated = useMemo(() => {
    if (serverPaginated) return filteredConges;
    const start = (clientCurrentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, clientCurrentPage, serverPaginated, filteredConges]);

  const totalPages = serverPaginated 
    ? Math.max(1, Math.ceil(totalCount / itemsPerPage)) 
    : Math.max(1, Math.ceil(sorted.length / itemsPerPage));

  useEffect(() => {
    if (!serverPaginated) setClientCurrentPage(1);
  }, [conges, searchQuery, filterType, serverPaginated]);

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
    <div className={`pro-card overflow-hidden ${isPending ? 'opacity-60 pointer-events-none' : ''} transition-opacity duration-200`}>
      {/* Search & Filter Header Bar */}
      {conges.length > 3 && (
        <div className="p-3 border-b border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Rechercher par employé ou matricule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Type :</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Tous les types</option>
              {Object.entries(TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/60 border-b border-slate-100">
          <tr>
            <th 
              className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 cursor-pointer hover:text-slate-900 transition-colors"
              onClick={() => handleSort("full_name")}
            >
              Collaborateur & Stock Solde <SortIcon column="full_name" />
            </th>
            <th 
              className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 cursor-pointer hover:text-slate-900 transition-colors"
              onClick={() => handleSort("type")}
            >
              Type <SortIcon column="type" />
            </th>
            <th 
              className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 cursor-pointer hover:text-slate-900 transition-colors"
              onClick={() => handleSort("date_debut")}
            >
              Date Départ & Période <SortIcon column="date_debut" />
            </th>
            <th 
              className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600"
            >
              Approbations (Workflow)
            </th>
            {showActions ? (
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Actions validation</th>
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
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {emp?.matricule && <span className="text-xs text-slate-400 font-mono">{emp.matricule}</span>}
                    {typeof c.solde_employe === "number" && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border tabular-nums",
                          c.solde_employe >= 5
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : c.solde_employe >= 1
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        )}
                        title="Stock de congés restants pour cet employé"
                      >
                        Stock : {c.solde_employe.toFixed(1)}j rest.
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-700 font-medium">{TYPE_LABELS[c.type] ?? c.type}</span>
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
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
                        title="Voir le justificatif"
                      >
                        <Paperclip className="h-3 w-3" />
                        Justificatif
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <DateDepartCell dateDebut={c.date_debut} dateFin={c.date_fin} nbJours={c.nb_jours} />
                </td>
                <td className="px-4 py-3 text-sm">
                  <WorkflowStepper statut={c.statut ?? "en_attente"} />
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
                        <p className="text-xs text-slate-600 italic">Motif : {c.refus_motif}</p>
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
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
            {serverPaginated ? totalCount : filteredConges.length} congé{serverPaginated ? (totalCount > 1 ? 's' : '') : (filteredConges.length > 1 ? 's' : '')}
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
