"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  Users,
  Briefcase,
  CaretDown,
  CaretUp,
  CaretLeft,
  CaretRight,
  SquaresFour,
  ListBullets,
  X,
  UserCheck,
  Building,
  Sparkle,
  Clock,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { DotsThreeVertical, Eye, PencilSimple, Archive } from "@phosphor-icons/react";
import { Tables } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuditTracking } from "@/hooks/use-audit-tracking";

type Employee = Tables<"employees">;

const AUBERGINE = "#ee7f03";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

type StatutKey = "actif" | "inactif" | "suspendu";

const statutConfig: Record<StatutKey, { label: string; badge: string; dot: string }> = {
  actif: { label: "Actif", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80", dot: "bg-emerald-500" },
  inactif: { label: "Inactif", badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  suspendu: { label: "Suspendu", badge: "bg-amber-50 text-amber-700 border-amber-200/80", dot: "bg-amber-500" },
};

function StatutBadge({ statut }: { statut: string | null }) {
  const key = (statut ?? "actif") as StatutKey;
  const cfg = statutConfig[key] ?? statutConfig.inactif;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold", cfg.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

interface Props {
  employees: Employee[];
  totalCount: number;
  allEmployees: {
    id: string;
    full_name: string;
    statut?: string | null;
    type_contrat?: string | null;
    departement?: string | null;
    genre?: string | null;
    poste?: string | null;
  }[];
  stats?: { total: number; actifs: number; cdiCount: number; pctFemmes: number; femmes: number };
}

export function EmployeeTable({ employees, totalCount, allEmployees }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  const { auditMap } = useAuditTracking("employee", showAuditLogs);

  const search = searchParams.get("q") || "";
  const filterStatut = searchParams.get("statut") || "tous";
  const filterContrat = searchParams.get("contrat") || "tous";
  const sortColumn = searchParams.get("sort") || "full_name";
  const sortDir = searchParams.get("dir") || "asc";
  const currentPage = Number(searchParams.get("page")) || 1;
  const itemsPerPage = 10;

  const statusCounts = useMemo(() => {
    const counts = { tous: allEmployees.length, actif: 0, inactif: 0, suspendu: 0 };
    allEmployees.forEach((e) => {
      const st = (e.statut ?? "actif") as StatutKey;
      if (counts[st] !== undefined) counts[st]++;
    });
    return counts;
  }, [allEmployees]);

  const contrats = useMemo(
    () => (Array.from(new Set(allEmployees.map((e) => e.type_contrat).filter(Boolean))) as string[]).sort(),
    [allEmployees]
  );

  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allEmployees.forEach((e) => {
      const d = e.departement || "Non affecté";
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allEmployees]);

  const contratCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allEmployees.forEach((e) => {
      const c = e.type_contrat || "Autre";
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allEmployees]);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, totalCount);

  const createQueryString = (params: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === "" || value === "tous") sp.delete(key);
      else sp.set(key, value);
    }
    return sp.toString();
  };

  const handleSearchChange = (val: string) => router.push(`${pathname}?${createQueryString({ q: val, page: "1" })}`);
  const handleStatutChange = (val: string) => router.push(`${pathname}?${createQueryString({ statut: val, page: "1" })}`);
  const handleContratChange = (val: string) => router.push(`${pathname}?${createQueryString({ contrat: val, page: "1" })}`);
  const handleSort = (col: string) => {
    const isAsc = sortColumn === col && sortDir === "asc";
    router.push(`${pathname}?${createQueryString({ sort: col, dir: isAsc ? "desc" : "asc", page: "1" })}`);
  };
  const handlePageChange = (page: number) => router.push(`${pathname}?${createQueryString({ page: page.toString() })}`);

  // ── Sélection (style Odoo : cases à cocher + barre d'actions contextuelle) ──
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allOnPageSelected = employees.length > 0 && employees.every((e) => selected.has(e.id));
  const toggleAllOnPage = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allOnPageSelected) employees.forEach((e) => n.delete(e.id));
      else employees.forEach((e) => n.add(e.id));
      return n;
    });

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <CaretDown className="ml-1 inline opacity-20" size={11} />;
    return sortDir === "asc" ? (
      <CaretUp className="ml-1 inline" size={11} weight="bold" style={{ color: AUBERGINE }} />
    ) : (
      <CaretDown className="ml-1 inline" size={11} weight="bold" style={{ color: AUBERGINE }} />
    );
  };

  const handleReactivate = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "actif" }),
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success(`${name} a été réactivé(e)`);
      router.refresh();
    } catch {
      toast.error("Impossible de réactiver le collaborateur");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      toast.success("Employé archivé avec succès");
      router.refresh();
    } catch {
      toast.error("Impossible d'archiver l'employé");
    }
  };

  if (employees.length === 0 && !search && filterStatut === "tous" && filterContrat === "tous") {
    return (
      <EmptyState
        icon={<Users className="h-14 w-14 text-slate-300" weight="duotone" />}
        title="Aucun collaborateur"
        description="Votre base de données est vide. Commencez par ajouter votre premier employé pour gérer votre effectif."
        action={<EmployeeDialog employees={employees} />}
      />
    );
  }

  const statusTabs = [
    { id: "tous", label: "Tous", count: statusCounts.tous },
    { id: "actif", label: "Actifs", count: statusCounts.actif },
    { id: "inactif", label: "Inactifs", count: statusCounts.inactif },
    { id: "suspendu", label: "Suspendus", count: statusCounts.suspendu },
  ];

  const viewBtns = [
    { id: "table" as const, icon: ListBullets, title: "Liste" },
    { id: "grid" as const, icon: SquaresFour, title: "Kanban" },
    { id: "analytics" as const, icon: Sparkle, title: "Graphique" },
  ];

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* ── Control panel Odoo ── */}
      <div className="flex flex-col gap-2 border-b border-slate-200 px-2.5 py-2 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        {/* Gauche : Nouveau + filtres statut */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <EmployeeDialog
            employees={employees}
            trigger={
              <button
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold text-white transition-colors"
                style={{ backgroundColor: AUBERGINE }}
              >
                <UserCheck size={15} weight="bold" /> Nouveau
              </button>
            }
          />
          <div className="flex items-center gap-0.5">
            {statusTabs.map((tab) => {
              const active = filterStatut === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleStatutChange(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    active ? "font-semibold" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                  style={active ? { backgroundColor: `${AUBERGINE}1a`, color: AUBERGINE } : undefined}
                >
                  {tab.label}
                  <span className="text-[11px] tabular-nums text-slate-400">{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Droite : recherche + contrat + pager + vues */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:flex-none">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} weight="bold" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-7 text-[13px] text-slate-800 outline-none transition-colors focus:border-[#ee7f03] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 lg:w-56"
            />
            {search && (
              <button onClick={() => handleSearchChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X size={13} weight="bold" />
              </button>
            )}
          </div>

          {contrats.length > 0 && (
            <select
              value={filterContrat}
              onChange={(e) => handleContratChange(e.target.value)}
              className="hidden h-8 rounded-md border border-slate-200 bg-white px-2 text-[13px] font-medium text-slate-700 outline-none focus:border-[#ee7f03] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:block"
            >
              <option value="tous">Tous contrats</option>
              {contrats.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowAuditLogs(prev => !prev)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-medium transition-colors focus:outline-none",
              showAuditLogs
                ? "bg-[#ee7f03]/10 border-[#ee7f03] text-[#ee7f03]"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-800"
            )}
            title="Afficher/Masquer les colonnes de suivi d'audit"
          >
            <Clock size={15} weight={showAuditLogs ? "fill" : "bold"} />
            <span className="hidden sm:inline">Suivi d&apos;audit</span>
          </button>

          {/* Pager */}
          <div className="hidden items-center gap-1 md:flex">
            <span className="text-[12px] tabular-nums text-slate-500">
              {rangeStart}-{rangeEnd} <span className="text-slate-300">/</span> {totalCount}
            </span>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>

          {/* Commutateur de vues */}
          <div className="flex items-center divide-x divide-slate-200 overflow-hidden rounded-md border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            {viewBtns.map((v) => {
              const Icon = v.icon;
              const active = viewMode === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  title={v.title}
                  className={cn("flex h-8 w-8 items-center justify-center transition-colors", active ? "text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")}
                  style={active ? { backgroundColor: AUBERGINE } : undefined}
                >
                  <Icon size={16} weight="bold" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Barre d'actions contextuelle (sélection) ── */}
      {selected.size > 0 && (
        <div
          className="flex items-center gap-3 border-b border-slate-200 px-3 py-1.5 text-[12.5px] dark:border-slate-800"
          style={{ backgroundColor: `${AUBERGINE}0d` }}
        >
          <span className="font-semibold" style={{ color: AUBERGINE }}>
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <button onClick={() => setSelected(new Set())} className="text-slate-500 hover:text-slate-800 hover:underline">
            Tout désélectionner
          </button>
        </div>
      )}

      {/* ── Contenu ── */}
      <AnimatePresence mode="wait">
        {viewMode === "table" ? (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="w-9 px-3 py-2">
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} className="h-3.5 w-3.5 cursor-pointer accent-[#ee7f03]" aria-label="Tout sélectionner" />
                  </th>
                  <th onClick={() => handleSort("full_name")} className="cursor-pointer px-3 py-2 text-[11px] font-semibold uppercase tracking-wide hover:text-slate-900 dark:hover:text-white">
                    Nom & Prénoms <SortIcon column="full_name" />
                  </th>
                  <th onClick={() => handleSort("matricule")} className="hidden cursor-pointer px-3 py-2 text-[11px] font-semibold uppercase tracking-wide hover:text-slate-900 md:table-cell dark:hover:text-white">
                    Matricule <SortIcon column="matricule" />
                  </th>
                  <th className="hidden px-3 py-2 text-[11px] font-semibold uppercase tracking-wide lg:table-cell">Poste</th>
                  <th className="hidden px-3 py-2 text-[11px] font-semibold uppercase tracking-wide lg:table-cell">Département</th>
                  <th onClick={() => handleSort("type_contrat")} className="hidden cursor-pointer px-3 py-2 text-[11px] font-semibold uppercase tracking-wide hover:text-slate-900 sm:table-cell dark:hover:text-white">
                    Contrat <SortIcon column="type_contrat" />
                  </th>
                  <th onClick={() => handleSort("salaire_brut")} className="hidden cursor-pointer px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide hover:text-slate-900 xl:table-cell dark:hover:text-white">
                    Salaire brut <SortIcon column="salaire_brut" />
                  </th>
                  <th onClick={() => handleSort("statut")} className="cursor-pointer px-3 py-2 text-[11px] font-semibold uppercase tracking-wide hover:text-slate-900 dark:hover:text-white">
                    Statut <SortIcon column="statut" />
                  </th>
                  {showAuditLogs && (
                    <>
                      <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">Création</th>
                      <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">Modification</th>
                      <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">Archivage</th>
                    </>
                  )}
                  <th className="w-9 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((emp) => {
                  const isSel = selected.has(emp.id);
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => router.push(`/employes/${emp.id}`)}
                      className={cn("group cursor-pointer transition-colors", isSel ? "bg-[#ee7f03]/[0.06]" : "hover:bg-[#ee7f03]/[0.04]")}
                    >
                      <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSel} onChange={() => toggleOne(emp.id)} className="h-3.5 w-3.5 cursor-pointer accent-[#ee7f03]" aria-label={`Sélectionner ${emp.full_name}`} />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={(emp as { photo_url?: string | null }).photo_url} name={emp.full_name} size={40} rounded="lg" className="border border-slate-200/80 shadow-sm" />
                          <span className="text-[13px] font-medium text-slate-800 group-hover:text-[#ee7f03] dark:text-slate-100">{emp.full_name}</span>
                        </div>
                      </td>
                      <td className="hidden px-3 py-1.5 text-[13px] font-mono tabular-nums text-slate-600 md:table-cell dark:text-slate-300">{emp.matricule}</td>
                      <td className="hidden max-w-[200px] truncate px-3 py-1.5 text-[13px] text-slate-600 lg:table-cell dark:text-slate-300">{emp.poste || "—"}</td>
                      <td className="hidden px-3 py-1.5 text-[13px] text-slate-600 lg:table-cell dark:text-slate-300">{emp.departement || "—"}</td>
                      <td className="hidden px-3 py-1.5 sm:table-cell">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{emp.type_contrat || "—"}</span>
                      </td>
                      <td className="hidden px-3 py-1.5 text-right text-[13px] font-mono tabular-nums text-slate-800 xl:table-cell dark:text-slate-100">
                        {emp.salaire_brut != null ? fmt(emp.salaire_brut) : "—"}
                      </td>
                      <td className="px-3 py-1.5"><StatutBadge statut={emp.statut} /></td>
                      {showAuditLogs && (
                        <>
                          <td className="px-3 py-1.5 text-[12px] text-slate-600 dark:text-slate-300" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const c = auditMap[emp.id]?.create;
                              const userStr = c ? (c.user_name || c.user_email || "N/A") : "Système";
                              const dateStr = new Date(c?.created_at || emp.created_at || new Date().toISOString()).toLocaleString("fr-CI", { dateStyle: "short", timeStyle: "short" });
                              return (
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-800 dark:text-slate-200">{userStr}</span>
                                  <span className="text-[11px] text-slate-400 font-mono">{dateStr}</span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-3 py-1.5 text-[12px] text-slate-600 dark:text-slate-300" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const u = auditMap[emp.id]?.update;
                              if (!u) return <span className="text-slate-400">—</span>;
                              const userStr = u.user_name || u.user_email || "N/A";
                              const dateStr = new Date(u.created_at).toLocaleString("fr-CI", { dateStyle: "short", timeStyle: "short" });
                              return (
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-800 dark:text-slate-200">{userStr}</span>
                                  <span className="text-[11px] text-slate-400 font-mono">{dateStr}</span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-3 py-1.5 text-[12px] text-slate-600 dark:text-slate-300" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const a = auditMap[emp.id]?.archive;
                              if (!a) return <span className="text-slate-400">—</span>;
                              const userStr = a.user_name || a.user_email || "N/A";
                              const dateStr = new Date(a.created_at).toLocaleString("fr-CI", { dateStyle: "short", timeStyle: "short" });
                              return (
                                <div className="flex flex-col">
                                  <span className="font-medium text-rose-700 dark:text-rose-450">{userStr}</span>
                                  <span className="text-[11px] text-rose-400 font-mono">{dateStr}</span>
                                </div>
                              );
                            })()}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex h-7 w-7 items-center justify-center rounded text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 dark:hover:bg-slate-800">
                              <DotsThreeVertical size={18} weight="bold" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-md">
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/employes/${emp.id}`} className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                                <Eye size={15} className="text-slate-400" /> Consulter la fiche
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
                              <EmployeeDialog
                                employee={emp}
                                trigger={
                                  <div className="flex w-full cursor-pointer items-center gap-2.5 px-2 py-1.5 text-[13px]">
                                    <PencilSimple size={15} className="text-slate-400" /> Modifier
                                  </div>
                                }
                              />
                            </DropdownMenuItem>
                            {emp.statut !== "actif" && (
                              <DropdownMenuItem onSelect={() => handleReactivate(emp.id, emp.full_name)} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600">
                                <UserCheck size={15} /> Réactiver
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <ConfirmDialog
                              title="Archiver le collaborateur"
                              description={`Voulez-vous archiver le dossier de ${emp.full_name} ? Le statut passera en Inactif.`}
                              confirmLabel="Archiver"
                              onConfirm={() => handleDelete(emp.id)}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-rose-600 focus:bg-rose-50 focus:text-rose-600">
                                  <Archive size={15} /> Archiver
                                </DropdownMenuItem>
                              }
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {employees.length === 0 && (
              <div className="p-10">
                <EmptyState
                  className="border-none bg-transparent"
                  icon={<MagnifyingGlass size={42} className="text-slate-300" weight="duotone" />}
                  title="Aucun résultat"
                  description={search ? `Aucun salarié ne correspond à « ${search} ».` : "Aucun salarié pour ces filtres."}
                  action={
                    <button onClick={() => handleSearchChange("")} className="text-[13px] font-semibold hover:underline" style={{ color: AUBERGINE }}>
                      Effacer les filtres
                    </button>
                  }
                />
              </div>
            )}
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="grid grid-cols-1 gap-3 bg-slate-50/40 p-3 dark:bg-slate-950/30 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {employees.map((emp) => (
              <div key={emp.id} className="flex flex-col justify-between rounded-md border border-slate-200 bg-white p-4 transition-colors hover:border-[#ee7f03]/40 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar src={(emp as { photo_url?: string | null }).photo_url} name={emp.full_name} size={40} rounded="lg" className="border border-slate-200/80" />
                  <div className="min-w-0">
                    <Link href={`/employes/${emp.id}`} className="line-clamp-1 text-[13px] font-semibold text-slate-900 hover:text-[#ee7f03] dark:text-slate-100">{emp.full_name}</Link>
                    <p className="mt-0.5 line-clamp-1 text-[12px] text-slate-500">{emp.poste || "Poste non défini"}</p>
                  </div>
                </div>
                <div className="space-y-1.5 border-y border-slate-100 py-2.5 text-[12px] dark:border-slate-800">
                  <div className="flex justify-between"><span className="text-slate-400">Matricule</span><span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{emp.matricule}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Département</span><span className="max-w-[130px] truncate font-medium text-slate-700 dark:text-slate-300">{emp.departement || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Contrat</span><span className="font-semibold text-slate-700 dark:text-slate-300">{emp.type_contrat || "—"}</span></div>
                </div>
                <div className="flex items-center justify-between pt-2.5">
                  <StatutBadge statut={emp.statut} />
                  <Link href={`/employes/${emp.id}`} className="text-[12px] font-semibold hover:underline" style={{ color: AUBERGINE }}>Fiche →</Link>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-900 dark:text-slate-100"><Building size={16} style={{ color: AUBERGINE }} /> Répartition par département</h3>
                <span className="text-[12px] font-mono text-slate-400">{departmentCounts.length} pôle(s)</span>
              </div>
              {departmentCounts.map(([dept, count]) => {
                const pct = Math.round((count / Math.max(allEmployees.length, 1)) * 100);
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-[12px] font-medium">
                      <span className="text-slate-700 dark:text-slate-300">{dept}</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100">{count} <span className="text-slate-400">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: AUBERGINE }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-900 dark:text-slate-100"><Briefcase size={16} className="text-amber-600" /> Structures contractuelles</h3>
                <span className="text-[12px] font-mono text-slate-400">{contratCounts.length} type(s)</span>
              </div>
              {contratCounts.map(([contrat, count]) => {
                const pct = Math.round((count / Math.max(allEmployees.length, 1)) * 100);
                return (
                  <div key={contrat} className="space-y-1">
                    <div className="flex justify-between text-[12px] font-medium">
                      <span className="text-slate-700 dark:text-slate-300">{contrat}</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100">{count} <span className="text-slate-400">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
