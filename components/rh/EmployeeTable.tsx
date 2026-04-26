"use client";

import { useState, useMemo } from "react";
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
  CaretDown
} from "@phosphor-icons/react";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import { Tables } from "@/types/supabase";
import { cn } from "@/lib/utils";

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
}

export function EmployeeTable({ employees }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [filterContrat, setFilterContrat] = useState("tous");

  const contrats = useMemo(() => {
    const types = Array.from(
      new Set(employees.map((e) => e.type_contrat).filter(Boolean))
    ) as string[];
    return types.sort();
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return employees.filter((e) => {
      if (filterStatut !== "tous" && (e.statut ?? "actif") !== filterStatut) return false;
      if (filterContrat !== "tous" && e.type_contrat !== filterContrat) return false;
      if (!q) return true;
      return (
        e.full_name.toLowerCase().includes(q) ||
        e.poste.toLowerCase().includes(q) ||
        e.matricule.toLowerCase().includes(q) ||
        (e.departement ?? "").toLowerCase().includes(q)
      );
    });
  }, [employees, search, filterStatut, filterContrat]);

  if (employees.length === 0 && !search) {
    return (
      <div className="rounded-[2.5rem] border-2 border-dashed border-slate-100 p-20 text-center bg-white/50 backdrop-blur-xl">
        <div className="w-20 h-20 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
          <Users className="h-10 w-10 text-slate-300" weight="duotone" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tightest">Aucun collaborateur</h3>
        <p className="mt-2 text-sm text-slate-500 font-medium max-w-xs mx-auto">
          Votre base de données est vide. Commencez par ajouter votre premier employé.
        </p>
      </div>
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
            onChange={(e) => setSearch(e.target.value)}
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
              onChange={(e) => setFilterStatut(e.target.value)}
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
                onChange={(e) => setFilterContrat(e.target.value)}
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
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Collaborateur</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden lg:table-cell">Identification</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden md:table-cell">Contrat & Dept</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden xl:table-cell">Rémunération</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Statut</th>
                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              <AnimatePresence mode="popLayout">
                {filtered.map((emp, i) => (
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
                       <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                         <EmployeeDialog employee={emp} />
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center bg-slate-50/30">
            <MagnifyingGlass size={48} className="mx-auto text-slate-200 mb-4" weight="duotone" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Aucun talent pour cette recherche</p>
          </div>
        )}

        <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {filtered.length} Talent{filtered.length > 1 ? 's' : ''} indexé{filtered.length > 1 ? 's' : ''}
              </span>
           </div>
           <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em]">Base RH Côte d'Ivoire v4.0</p>
        </div>
      </div>
    </div>
  );
}
