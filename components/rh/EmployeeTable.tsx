"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MagnifyingGlass, 
  Users, 
  Funnel,
  Briefcase,
  CaretDown,
  CaretUp,
  SquaresFour,
  ListBullets,
  X,
  UserCheck,
  Building,
  MapPin,
  EnvelopeSimple,
  PhoneCall,
  Sparkle
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
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  DotsThreeVertical,
  Eye,
  PencilSimple,
  Archive
} from "@phosphor-icons/react";
import { Tables } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type Employee = Tables<"employees">;

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(n);

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

type StatutKey = "actif" | "inactif" | "suspendu";

const statutConfig: Record<StatutKey, { label: string; badge: string; dot: string }> = {
  actif: {
    label: "Actif",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  inactif: {
    label: "Inactif",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  suspendu: {
    label: "Suspendu",
    badge: "bg-amber-50 text-amber-700 border-amber-200/80",
    dot: "bg-amber-500",
  },
};

function StatutBadge({ statut }: { statut: string | null }) {
  const key = (statut ?? "actif") as StatutKey;
  const cfg = statutConfig[key] ?? statutConfig.inactif;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-tight shadow-2xs",
        cfg.badge
      )}
    >
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
  stats?: {
    total: number;
    actifs: number;
    cdiCount: number;
    pctFemmes: number;
    femmes: number;
  };
}

export function EmployeeTable({ employees, totalCount, allEmployees, stats }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">("table");

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

  const contrats = useMemo(() => {
    const types = Array.from(
      new Set(allEmployees.map((e) => e.type_contrat).filter(Boolean))
    ) as string[];
    return types.sort();
  }, [allEmployees]);

  const departements = useMemo(() => {
    const depts = Array.from(
      new Set(allEmployees.map((e) => e.departement).filter(Boolean))
    ) as string[];
    return depts.sort();
  }, [allEmployees]);

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

  const createQueryString = (params: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === "" || value === "tous") {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    }
    return newSearchParams.toString();
  };

  const handleSearchChange = (val: string) => {
    router.push(`${pathname}?${createQueryString({ q: val, page: "1" })}`);
  };

  const handleStatutChange = (val: string) => {
    router.push(`${pathname}?${createQueryString({ statut: val, page: "1" })}`);
  };

  const handleContratChange = (val: string) => {
    router.push(`${pathname}?${createQueryString({ contrat: val, page: "1" })}`);
  };

  const handleSort = (col: string) => {
    const isAsc = sortColumn === col && sortDir === "asc";
    router.push(`${pathname}?${createQueryString({ sort: col, dir: isAsc ? "desc" : "asc", page: "1" })}`);
  };

  const handlePageChange = (page: number) => {
    router.push(`${pathname}?${createQueryString({ page: page.toString() })}`);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <CaretDown className="opacity-20 ml-1 inline text-slate-400" size={12} />;
    return sortDir === "asc" ? (
      <CaretUp className="opacity-100 ml-1 inline text-[#FF8200]" size={12} weight="bold" />
    ) : (
      <CaretDown className="opacity-100 ml-1 inline text-[#FF8200]" size={12} weight="bold" />
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      toast.success("Employé archivé avec succès");
      router.refresh();
    } catch (error) {
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
      {/* Sleek Integrated KPI Strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-white border-b border-slate-200/80">
          <div className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF8200]/10 text-[#FF8200] flex items-center justify-center shrink-0">
              <Users size={20} weight="duotone" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Effectif</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-slate-900 font-mono">{stats.total}</span>
                <span className="text-[10px] font-semibold text-slate-500">salariés</span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <UserCheck size={20} weight="duotone" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Effectif Actif</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-slate-900 font-mono">{stats.actifs}</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                  {stats.total > 0 ? Math.round((stats.actifs / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
              <Briefcase size={20} weight="duotone" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contrats CDI</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-slate-900 font-mono">{stats.cdiCount}</span>
                <span className="text-[10px] font-semibold text-slate-500">permanents</span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Sparkle size={20} weight="duotone" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Taux Parité (F)</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-slate-900 font-mono">{stats.pctFemmes}%</span>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-mono">
                  {stats.femmes} femmes
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workstation Header Toolbar: Segmented Tabs, View Switcher, Search & Filters */}
      <div className="p-4 sm:p-5 bg-slate-50/50 border-b border-slate-200/70 space-y-3.5">
        {/* Top Control Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Segmented Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200/60 overflow-x-auto">
            {[
              { id: "tous", label: "Tous les salariés", count: statusCounts.tous },
              { id: "actif", label: "Actifs", count: statusCounts.actif },
              { id: "inactif", label: "Inactifs", count: statusCounts.inactif },
              { id: "suspendu", label: "Suspendus", count: statusCounts.suspendu },
            ].map((tab) => {
              const isActive = filterStatut === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleStatutChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap outline-none cursor-pointer",
                    isActive
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-mono font-black",
                      isActive ? "bg-[#FF8200] text-white" : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Display Mode Toggle & Primary Action (Zero Friction) */}
          <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto shrink-0">
            <EmployeeDialog 
              employees={employees}
              trigger={
                <button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FF8200] hover:bg-[#E07400] text-white text-xs font-black transition-all shadow-md shadow-[#FF8200]/20 hover:scale-105 active:scale-95 cursor-pointer outline-none">
                  <UserCheck size={16} weight="bold" />
                  <span>+ Nouveau Collaborateur</span>
                </button>
              }
            />
            <div className="flex items-center bg-slate-200/60 p-1 rounded-2xl border border-slate-200/60">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all outline-none cursor-pointer",
                  viewMode === "table"
                    ? "bg-white text-[#FF8200] shadow-sm border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="Vue Tableau Détaillé"
              >
                <ListBullets size={16} weight="bold" />
                <span className="hidden sm:inline">Tableau</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all outline-none cursor-pointer",
                  viewMode === "grid"
                    ? "bg-white text-[#FF8200] shadow-sm border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="Vue Trombinoscope (Cartes RH)"
              >
                <SquaresFour size={16} weight="bold" />
                <span className="hidden sm:inline">Trombinoscope</span>
              </button>
              <button
                onClick={() => setViewMode("analytics")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all outline-none cursor-pointer",
                  viewMode === "analytics"
                    ? "bg-white text-[#FF8200] shadow-sm border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="Vue Cockpit Synthétique & Répartition"
              >
                <Sparkle size={16} weight="bold" />
                <span className="hidden sm:inline">Cockpit BI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Filter Strip: Search Input & Contract Select */}
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between pt-1">
          <div className="relative flex-1 w-full group">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FF8200] transition-colors">
              <MagnifyingGlass size={18} weight="bold" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, poste, département..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-11 pl-10 pr-9 rounded-2xl bg-white border border-slate-200/90 font-medium text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#FF8200] focus:ring-4 focus:ring-[#FF8200]/10 transition-all outline-none shadow-xs"
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
            {contrats.length > 0 && (
              <div className="relative group w-full sm:w-auto">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF8200] z-10 pointer-events-none">
                  <Briefcase size={16} weight="bold" />
                </div>
                <select
                  value={filterContrat}
                  onChange={(e) => handleContratChange(e.target.value)}
                  className="h-11 w-full sm:w-auto pl-10 pr-9 rounded-2xl bg-white border border-slate-200/90 font-bold text-xs text-slate-700 appearance-none outline-none cursor-pointer focus:border-[#FF8200] focus:ring-4 focus:ring-[#FF8200]/10 transition-all min-w-[190px] shadow-xs"
                >
                  <option value="tous">Tous les types de contrat</option>
                  {contrats.map((c) => (
                    <option key={c} value={c}>Contrat: {c}</option>
                  ))}
                </select>
                <CaretDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} weight="bold" />
              </div>
            )}
          </div>
        </div>

        {/* Quick Department Filter Pills (Zero-Click User Journey) */}
        {departements.length > 0 && (
          <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Building size={12} weight="bold" /> Départements:
            </span>
            <button
              onClick={() => handleSearchChange("")}
              className={cn(
                "px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer border",
                !search || !departements.some(d => search.toLowerCase() === d.toLowerCase())
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100"
              )}
            >
              Tous
            </button>
            {departements.map((dept) => {
              const isSelected = search.toLowerCase() === dept.toLowerCase();
              return (
                <button
                  key={dept}
                  onClick={() => handleSearchChange(isSelected ? "" : dept)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5",
                    isSelected
                      ? "bg-[#FF8200] text-white border-[#FF8200] shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <span>{dept}</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[9px] font-mono",
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {allEmployees.filter(e => e.departement === dept).length}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Region: Table, Trombinoscope Grid, or Cockpit BI */}
      <div className="flex-1 p-0">
        <AnimatePresence mode="wait">
          {viewMode === "table" ? (
            <motion.div
              key="table-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-x-auto"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 select-none">
                    <th 
                      className="px-6 py-4 text-[11px] font-black uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors"
                      onClick={() => handleSort("full_name")}
                    >
                      Collaborateur <SortIcon column="full_name" />
                    </th>
                    <th 
                      className="px-6 py-4 text-[11px] font-black uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:text-slate-900 transition-colors"
                      onClick={() => handleSort("matricule")}
                    >
                      Matricule & Genre <SortIcon column="matricule" />
                    </th>
                    <th 
                      className="px-6 py-4 text-[11px] font-black uppercase tracking-wider hidden md:table-cell cursor-pointer hover:text-slate-900 transition-colors"
                      onClick={() => handleSort("type_contrat")}
                    >
                      Contrat & Département <SortIcon column="type_contrat" />
                    </th>
                    <th 
                      className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider hidden xl:table-cell cursor-pointer hover:text-slate-900 transition-colors"
                      onClick={() => handleSort("salaire_brut")}
                    >
                      Rémunération Brut <SortIcon column="salaire_brut" />
                    </th>
                    <th 
                      className="px-6 py-4 text-[11px] font-black uppercase tracking-wider cursor-pointer hover:text-slate-900 transition-colors"
                      onClick={() => handleSort("statut")}
                    >
                      Statut <SortIcon column="statut" />
                    </th>
                    <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="group hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/90 border border-slate-200/80 flex items-center justify-center text-slate-800 font-black text-xs shadow-2xs group-hover:border-[#FF8200]/40 transition-colors">
                            {getInitials(emp.full_name)}
                          </div>
                          <div className="min-w-0">
                            <Link 
                              href={`/employes/${emp.id}`}
                              className="text-sm font-bold text-slate-900 hover:text-[#FF8200] transition-colors line-clamp-1"
                            >
                              {emp.full_name}
                            </Link>
                            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{emp.poste || "Poste non renseigné"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg w-max border border-slate-200/60">
                          {emp.matricule}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{emp.genre === 'F' ? 'Femme' : emp.genre === 'M' ? 'Homme' : '—'}</div>
                      </td>

                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-md text-[10px] font-black uppercase tracking-wider border border-amber-200/60 w-max">
                            {emp.type_contrat || 'N/A'}
                          </span>
                          <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                            <Building size={13} className="text-slate-400 shrink-0" />
                            {emp.departement || 'Non affecté'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right hidden xl:table-cell">
                        <div className="text-sm font-black text-slate-900 font-mono tabular-nums">
                          {emp.salaire_brut != null ? fmt(emp.salaire_brut) : "—"}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Brut Mensuel</span>
                      </td>

                      <td className="px-6 py-4">
                        <StatutBadge statut={emp.statut} />
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/employes/${emp.id}`}
                            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-[#FF8200] text-slate-700 hover:text-white text-xs font-bold transition-all outline-none"
                            title="Consulter la fiche RH"
                          >
                            <Eye size={15} weight="bold" />
                            <span className="hidden sm:inline">Consulter</span>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all outline-none cursor-pointer">
                                <DotsThreeVertical size={20} weight="bold" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-2 rounded-2xl border-slate-200 shadow-xl bg-white">
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2.5 py-1.5">Options Collaborateur</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/employes/${emp.id}`} className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-slate-50 font-semibold text-xs text-slate-700 outline-none">
                                  <Eye size={16} weight="duotone" className="text-slate-400" />
                                  <span>Consulter la fiche</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0 focus:bg-transparent">
                                <EmployeeDialog 
                                  employee={emp} 
                                  trigger={
                                    <div className="flex items-center gap-2.5 w-full p-2 rounded-xl cursor-pointer hover:bg-slate-50 font-semibold text-xs text-slate-700 transition-colors outline-none">
                                      <PencilSimple size={16} weight="duotone" className="text-slate-400" />
                                      <span>Modifier le profil</span>
                                    </div>
                                  }
                                />
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-slate-100" />
                              <ConfirmDialog
                                title="Archiver le collaborateur"
                                description={`Voulez-vous archiver le dossier de ${emp.full_name} ? Le statut passera en Inactif.`}
                                confirmLabel="Archiver"
                                onConfirm={() => handleDelete(emp.id)}
                                trigger={
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 font-semibold text-xs outline-none">
                                    <Archive size={16} weight="duotone" />
                                    <span>Archiver le profil</span>
                                  </DropdownMenuItem>
                                }
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : viewMode === "grid" ? (
            /* Trombinoscope Grid View */
            <motion.div
              key="grid-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 bg-slate-50/30"
            >
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/80 flex items-center justify-center text-slate-800 font-black text-sm shadow-2xs group-hover:border-[#FF8200]/40 transition-colors">
                          {getInitials(emp.full_name)}
                        </div>
                        <div>
                          <Link 
                            href={`/employes/${emp.id}`}
                            className="font-black text-sm text-slate-900 hover:text-[#FF8200] transition-colors line-clamp-1"
                          >
                            {emp.full_name}
                          </Link>
                          <p className="text-xs font-semibold text-slate-500 line-clamp-1 mt-0.5">{emp.poste || "Poste non défini"}</p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-8 w-8 inline-flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all outline-none shrink-0 cursor-pointer">
                            <DotsThreeVertical size={18} weight="bold" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-slate-200 shadow-xl bg-white">
                          <DropdownMenuItem asChild>
                            <Link href={`/employes/${emp.id}`} className="flex items-center gap-2 p-2 rounded-xl font-semibold text-xs text-slate-700 cursor-pointer">
                              <Eye size={16} />
                              <span>Voir la fiche</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
                            <EmployeeDialog 
                              employee={emp} 
                              trigger={
                                <div className="flex items-center gap-2 w-full p-2 rounded-xl font-semibold text-xs text-slate-700 cursor-pointer">
                                  <PencilSimple size={16} />
                                  <span>Modifier</span>
                                </div>
                              }
                            />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2.5 py-3 border-y border-slate-100 my-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Matricule:</span>
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md text-[11px] border border-slate-200/50">{emp.matricule}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Département:</span>
                        <span className="font-bold text-slate-700 truncate max-w-[130px]">{emp.departement || "Non affecté"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Contrat:</span>
                        <span className="font-black text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md text-[10px] uppercase border border-amber-200/60">{emp.type_contrat || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <StatutBadge statut={emp.statut} />
                    <Link
                      href={`/employes/${emp.id}`}
                      className="text-xs font-bold text-[#FF8200] hover:underline inline-flex items-center gap-1"
                    >
                      Fiche RH &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            /* Cockpit BI Analytics View */
            <motion.div
              key="analytics-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-6 sm:p-8 bg-slate-50/40 space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#FF8200]/10 text-[#FF8200] flex items-center justify-center">
                        <Building size={18} weight="bold" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Répartition par Département</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Distribution globale de l'effectif</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 font-mono">{departmentCounts.length} pôle(s)</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {departmentCounts.map(([dept, count]) => {
                      const pct = Math.round((count / allEmployees.length) * 100);
                      return (
                        <div key={dept} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#FF8200]"></span>
                              {dept}
                            </span>
                            <span className="text-slate-900 font-mono">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#FF8200] to-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Contract Types Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                        <Briefcase size={18} weight="bold" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Structures Contractuelles</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Répartition CDI, CDD et autres</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 font-mono">{contratCounts.length} type(s)</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {contratCounts.map(([contrat, count]) => {
                      const pct = Math.round((count / allEmployees.length) * 100);
                      return (
                        <div key={contrat} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              Contrat {contrat}
                            </span>
                            <span className="text-slate-900 font-mono">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {employees.length === 0 && search && (
        <div className="p-12 text-center">
          <EmptyState
            className="border-none bg-transparent"
            icon={<MagnifyingGlass size={48} className="text-slate-300" weight="duotone" />}
            title="Aucun collaborateur trouvé"
            description={`Aucun salarié ne correspond à votre recherche "${search}".`}
            action={
              <button 
                onClick={() => handleSearchChange("")}
                className="text-xs font-bold text-[#FF8200] hover:underline uppercase tracking-wider cursor-pointer"
              >
                Effacer les filtres
              </button>
            }
          />
        </div>
      )}

      {/* Integrated Workstation Pagination Footer */}
      <div className="border-t border-slate-200/80 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">
            Affichage de <span className="text-slate-900 font-black font-mono">{employees.length}</span> sur <span className="text-slate-900 font-black font-mono">{totalCount}</span> collaborateurs
          </span>
        </div>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        <p className="text-[11px] text-slate-400 font-bold hidden lg:block">RH Manager CI &bull; Système d'Information RH</p>
      </div>
    </div>
  );
}
