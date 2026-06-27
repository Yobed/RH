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

const statutConfig: Record<StatutKey, { label: string; dot: string }> = {
  actif: {
    label: "Actif",
    dot: "bg-slate-400",
  },
  inactif: {
    label: "Inactif",
    dot: "bg-slate-300",
  },
  suspendu: {
    label: "Suspendu",
    dot: "bg-slate-300",
  },
};

function StatutBadge({ statut }: { statut: string | null }) {
  const key = (statut ?? "actif") as StatutKey;
  const cfg = statutConfig[key] ?? statutConfig.inactif;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600"
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
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
      <div className="p-4 flex flex-col xl:flex-row gap-4 items-center bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="relative flex-1 group w-full">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2563eb] transition-colors">
            <MagnifyingGlass size={18} weight="bold" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un collaborateur (nom, poste, matricule...)"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-lg bg-white border border-slate-200 font-medium text-sm focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative group">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563eb] z-10">
               <Funnel size={14} weight="bold" />
             </div>
             <select
              value={filterStatut}
              onChange={(e) => handleStatutChange(e.target.value)}
              className="h-11 pl-10 pr-10 rounded-lg bg-white border border-slate-200 font-semibold text-xs text-slate-700 appearance-none outline-none cursor-pointer focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all min-w-[180px]"
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
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563eb] z-10">
                 <Briefcase size={14} weight="bold" />
               </div>
               <select
                value={filterContrat}
                onChange={(e) => handleContratChange(e.target.value)}
                className="h-11 pl-10 pr-10 rounded-lg bg-white border border-slate-200 font-semibold text-xs text-slate-700 appearance-none outline-none cursor-pointer focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all min-w-[180px]"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th 
                  className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("full_name")}
                >
                  Collaborateur <SortIcon column="full_name" />
                </th>
                <th 
                  className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hidden lg:table-cell cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("matricule")}
                >
                  Identification <SortIcon column="matricule" />
                </th>
                <th 
                  className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("type_contrat")}
                >
                  Contrat & Dept <SortIcon column="type_contrat" />
                </th>
                <th 
                  className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hidden xl:table-cell cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("salaire_brut")}
                >
                  Rémunération <SortIcon column="salaire_brut" />
                </th>
                <th 
                  className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("statut")}
                >
                  Statut <SortIcon column="statut" />
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {employees.map((emp, i) => (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                    className="group hover:bg-slate-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs transition-colors duration-300">
                             {getInitials(emp.full_name)}
                          </div>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white",
                            statutConfig[emp.statut as StatutKey]?.dot || "bg-slate-300"
                          )} />
                        </div>
                        <div className="min-w-0">
                          <Link 
                            href={`/employes/${emp.id}`}
                            className="text-sm font-semibold text-slate-900 tracking-tight leading-none hover:text-[#2563eb] transition-colors"
                          >
                            {emp.full_name}
                          </Link>
                          <p className="text-xs text-slate-500 font-medium mt-1 truncate">{emp.poste}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="text-xs font-mono text-slate-600">{emp.matricule}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">{emp.genre || 'N/A'}</div>
                    </td>

                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold uppercase tracking-wider text-slate-600 w-max">
                           {emp.type_contrat || '—'}
                        </div>
                        <span className="text-xs text-slate-500">{emp.departement || 'Non affecté'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right hidden xl:table-cell">
                      <div className="text-sm font-semibold text-slate-900">
                         {emp.salaire_brut != null ? fmt(emp.salaire_brut) : "—"}
                      </div>
                      <span className="text-[10px] text-slate-400">Brut Mensuel</span>
                    </td>

                    <td className="px-6 py-4">
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

        <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {totalCount} collaborateur{totalCount > 1 ? 's' : ''} au total
              </span>
           </div>
           
           <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
           />

           <p className="text-[10px] text-slate-400 font-medium hidden lg:block">Base RH Côte d'Ivoire v4.0</p>
        </div>
      </div>
    </div>
  );
}
