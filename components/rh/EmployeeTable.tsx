"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MagnifyingGlass, 
  Users, 
  ArrowRight, 
  Funnel,
  IdentificationCard,
  Briefcase,
  Buildings,
  CurrencyCircleDollar,
  UserCircle,
  CaretDown,
  CaretUp,
  CaretLeft,
  CaretRight,
  Trash
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

const statutConfig: Record<StatutKey, { label: string; dot: string; bg: string; text: string; oklch: string }> = {
  actif: {
    label: "Actif",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    oklch: "oklch(0.55 0.18 155)"
  },
  inactif: {
    label: "Inactif",
    dot: "bg-slate-400",
    bg: "bg-slate-400/10",
    text: "text-slate-600",
    oklch: "oklch(0.55 0.02 248)"
  },
  suspendu: {
    label: "Suspendu",
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    oklch: "oklch(0.78 0.13 73)"
  },
};

function StatutBadge({ statut }: { statut: string | null }) {
  const key = (statut ?? "actif") as StatutKey;
  const cfg = statutConfig[key] ?? statutConfig.inactif;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
        cfg.bg,
        cfg.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0 animate-pulse", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

interface Props {
  employees: Employee[];
  totalCount: number;
  allEmployees: { id: string; full_name: string; type_contrat?: string | null }[];
}

export function EmployeeTable({ employees, totalCount, allEmployees }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") || "";
  const filterStatut = searchParams.get("statut") || "tous";
  const filterContrat = searchParams.get("contrat") || "tous";
  const sortColumn = searchParams.get("sort") || "full_name";
  const sortDir = searchParams.get("dir") || "asc";
  const currentPage = Number(searchParams.get("page")) || 1;
  const itemsPerPage = 10;

  const contrats = useMemo(() => {
    const types = Array.from(
      new Set(allEmployees.map((e) => e.type_contrat).filter(Boolean))
    ) as string[];
    return types.sort();
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
    if (sortColumn !== column) return <CaretDown className="opacity-20 ml-1 inline" size={12} />;
    return sortDir === "asc" ? (
      <CaretUp className="opacity-100 ml-1 inline text-slate-900" size={12} weight="bold" />
    ) : (
      <CaretDown className="opacity-100 ml-1 inline text-slate-900" size={12} weight="bold" />
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

  if (employees.length === 0 && !search) {
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
    <div className="space-y-8">
      {/* Premium Search & Filters Area */}
      <div className="bg-white/70 backdrop-blur-2xl border border-slate-100 p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col xl:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
            <MagnifyingGlass size={20} weight="bold" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un talent (nom, poste, matricule...)"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50/50 border-none font-bold text-sm focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative group">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 z-10">
               <Funnel size={16} weight="bold" />
             </div>
             <select
              value={filterStatut}
              onChange={(e) => handleStatutChange(e.target.value)}
              className="h-14 pl-11 pr-10 rounded-2xl bg-slate-50 border-none font-black text-[10px] uppercase tracking-widest appearance-none outline-none cursor-pointer focus:ring-2 focus:ring-slate-900/5 min-w-[200px]"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Statut : Actif</option>
              <option value="inactif">Statut : Inactif</option>
              <option value="suspendu">Statut : Suspendu</option>
            </select>
            <CaretDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} weight="bold" />
          </div>

          {contrats.length > 0 && (
            <div className="relative group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                 <Briefcase size={16} weight="bold" />
               </div>
               <select
                value={filterContrat}
                onChange={(e) => handleContratChange(e.target.value)}
                className="h-14 pl-11 pr-10 rounded-2xl bg-slate-50 border-none font-black text-[10px] uppercase tracking-widest appearance-none outline-none cursor-pointer focus:ring-2 focus:ring-slate-900/5 min-w-[200px]"
              >
                <option value="tous">Tous les contrats</option>
                {contrats.map((c) => (
                  <option key={c} value={c}>Contrat : {c}</option>
                ))}
              </select>
              <CaretDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} weight="bold" />
            </div>
          )}
        </div>
      </div>

      {/* Main Table Interface */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                <th 
                  className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-slate-700 transition-colors"
                  onClick={() => handleSort("full_name")}
                >
                  Collaborateur <SortIcon column="full_name" />
                </th>
                <th 
                  className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden lg:table-cell cursor-pointer hover:text-slate-700 transition-colors"
                  onClick={() => handleSort("matricule")}
                >
                  Identification <SortIcon column="matricule" />
                </th>
                <th 
                  className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden md:table-cell cursor-pointer hover:text-slate-700 transition-colors"
                  onClick={() => handleSort("type_contrat")}
                >
                  Contrat & Dept <SortIcon column="type_contrat" />
                </th>
                <th 
                  className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden xl:table-cell cursor-pointer hover:text-slate-700 transition-colors"
                  onClick={() => handleSort("salaire_brut")}
                >
                  Rémunération <SortIcon column="salaire_brut" />
                </th>
                <th 
                  className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-slate-700 transition-colors"
                  onClick={() => handleSort("statut")}
                >
                  Statut <SortIcon column="statut" />
                </th>
                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              <AnimatePresence mode="popLayout">
                {employees.map((emp, i) => (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                    className="group hover:bg-slate-50/50 transition-all duration-300"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 border-[3px] border-white shadow-lg flex items-center justify-center text-white font-black text-xs group-hover:rotate-[6deg] transition-transform duration-500">
                             {getInitials(emp.full_name)}
                          </div>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                            statutConfig[emp.statut as StatutKey]?.dot || "bg-slate-300"
                          )} />
                        </div>
                        <div className="min-w-0">
                          <Link 
                            href={`/employes/${emp.id}`}
                            className="text-sm font-black text-slate-900 tracking-tight leading-none hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            {emp.full_name}
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </Link>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 truncate">{emp.poste}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-6 hidden lg:table-cell">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-slate-400 font-bold">
                          <IdentificationCard size={14} />
                          <span className="text-[11px] font-mono tabular-nums tracking-wider uppercase">{emp.matricule}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-bold">
                          <UserCircle size={14} />
                          <span className="text-[10px] uppercase tracking-widest">{emp.genre || 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-6 hidden md:table-cell">
                      <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-lg w-max">
                           <Briefcase size={12} className="text-slate-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{emp.type_contrat || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 px-1 text-slate-400">
                           <Buildings size={12} />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{emp.departement || 'Non affecté'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-6 text-right hidden xl:table-cell">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-slate-900 font-black text-sm tracking-tight">
                           {emp.salaire_brut != null ? fmt(emp.salaire_brut) : "—"}
                           <CurrencyCircleDollar size={16} className="text-emerald-500" />
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Salaire Brut Mensuel</span>
                      </div>
                    </td>

                    <td className="px-6 py-6">
                      <StatutBadge statut={emp.statut} />
                    </td>

                    <td className="px-6 py-6 text-center">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <button className="h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all outline-none">
                             <DotsThreeVertical size={20} weight="bold" />
                           </button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-slate-100 shadow-xl">
                           <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-1.5">Actions</DropdownMenuLabel>
                           <DropdownMenuItem asChild>
                             <Link href={`/employes/${emp.id}`} className="flex items-center gap-2 p-2 rounded-xl cursor-pointer focus:bg-slate-50 outline-none">
                               <Eye size={16} weight="duotone" className="text-slate-400" />
                               <span className="text-xs font-bold text-slate-700">Voir la fiche</span>
                             </Link>
                           </DropdownMenuItem>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0 focus:bg-transparent">
                             <EmployeeDialog 
                               employee={emp} 
                               trigger={
                                 <div className="flex items-center gap-2 w-full p-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors outline-none">
                                   <PencilSimple size={16} weight="duotone" className="text-slate-400" />
                                   <span className="text-xs font-bold text-slate-700">Modifier</span>
                                 </div>
                               }
                             />
                           </DropdownMenuItem>
                           <DropdownMenuSeparator className="my-1 bg-slate-50" />
                           <ConfirmDialog
                             title="Archiver l'employé"
                             description={`Êtes-vous sûr de vouloir archiver ${emp.full_name} ? Son profil sera conservé mais son statut passera à Inactif.`}
                             confirmLabel="Archiver"
                             onConfirm={() => handleDelete(emp.id)}
                             trigger={
                               <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 p-2 rounded-xl cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 outline-none">
                                 <Archive size={16} weight="duotone" />
                                 <span className="text-xs font-bold">Archiver</span>
                               </DropdownMenuItem>
                             }
                           />
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {employees.length === 0 && search && (
          <EmptyState
            className="border-none bg-transparent py-16"
            icon={<MagnifyingGlass size={48} className="text-slate-200" weight="duotone" />}
            title="Aucun talent trouvé"
            description={`Nous n'avons trouvé aucun collaborateur correspondant à "${search}".`}
            action={
              <button 
                onClick={() => handleSearchChange("")}
                className="text-xs font-black uppercase tracking-widest text-slate-900 hover:underline"
              >
                Effacer la recherche
              </button>
            }
          />
        )}

        <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">
                {totalCount} Talent{totalCount > 1 ? 's' : ''} indexé{totalCount > 1 ? 's' : ''}
              </span>
           </div>
           
           <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
           />

           <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] hidden lg:block">Base RH Côte d'Ivoire v4.0</p>
        </div>
      </div>
    </div>
  );
}
