"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlass, Users, ArrowRight } from "@phosphor-icons/react";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import { Tables } from "@/types/supabase";

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

const statutConfig: Record<StatutKey, { label: string; dot: string; bg: string; text: string }> = {
  actif: {
    label: "Actif",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  inactif: {
    label: "Inactif",
    dot: "bg-slate-400",
    bg: "bg-slate-100",
    text: "text-slate-600",
  },
  suspendu: {
    label: "Suspendu",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
};

function StatutBadge({ statut }: { statut: string | null }) {
  const key = (statut ?? "actif") as StatutKey;
  const cfg = statutConfig[key] ?? statutConfig.inactif;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const selectClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.175_0.04_248)]/30 shadow-sm";

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

  if (employees.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center bg-white">
        <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-medium text-slate-600">Aucun employé enregistré</p>
        <p className="mt-1 text-sm text-slate-600">
          Cliquez sur &ldquo;Ajouter un employé&rdquo; pour commencer.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-4"
    >
      {/* Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600"
            weight="bold"
          />
          <input
            type="text"
            placeholder="Rechercher par nom, poste, matricule, département…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-600 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.175_0.04_248)]/30"
          />
        </div>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className={selectClass}
        >
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="suspendu">Suspendu</option>
        </select>
        {contrats.length > 0 && (
          <select
            value={filterContrat}
            onChange={(e) => setFilterContrat(e.target.value)}
            className={selectClass}
          >
            <option value="tous">Tous les contrats</option>
            {contrats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Compteur */}
      <p className="text-sm text-slate-600">
        <span className="font-semibold font-mono tabular-nums text-slate-700">{filtered.length}</span>
        {" "}employé{filtered.length > 1 ? "s" : ""}
        {search || filterStatut !== "tous" || filterContrat !== "tous" ? " (filtré)" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-600 bg-white">
          Aucun employé ne correspond aux critères.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden md:table-cell">
                  Employé
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 md:hidden">
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden lg:table-cell">
                  Matricule
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden md:table-cell">
                  Contrat
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden xl:table-cell">
                  Salaire brut
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Statut
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence initial={false}>
                {filtered.map((emp, i) => (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.02 }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Employé : avatar + nom + poste */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            background: "oklch(0.175 0.04 248)",
                            color: "oklch(0.78 0.13 73)",
                          }}
                        >
                          {getInitials(emp.full_name)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/employes/${emp.id}`}
                            className="font-semibold text-slate-900 hover:text-[oklch(0.175_0.04_248)] transition-colors flex items-center gap-1 group"
                          >
                            {emp.full_name}
                            <ArrowRight
                              className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                              weight="bold"
                            />
                          </Link>
                          <p className="text-xs text-slate-600 truncate">{emp.poste}</p>
                        </div>
                      </div>
                    </td>
                    {/* Nom seul (mobile) */}
                    <td className="px-4 py-3 md:hidden">
                      <Link
                        href={`/employes/${emp.id}`}
                        className="font-semibold text-slate-900 hover:underline"
                      >
                        {emp.full_name}
                      </Link>
                      <p className="text-xs text-slate-600">{emp.poste}</p>
                    </td>
                    {/* Matricule */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono tabular-nums text-xs text-slate-600">
                        {emp.matricule}
                      </span>
                    </td>
                    {/* Contrat */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {emp.type_contrat ? (
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {emp.type_contrat}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {/* Salaire */}
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      <span className="font-mono tabular-nums text-sm text-slate-800">
                        {emp.salaire_brut != null ? fmt(emp.salaire_brut) : "—"}
                      </span>
                    </td>
                    {/* Statut */}
                    <td className="px-4 py-3">
                      <StatutBadge statut={emp.statut} />
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <EmployeeDialog employee={emp} />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
