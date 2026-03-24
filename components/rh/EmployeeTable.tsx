"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import { Search, Users } from "lucide-react";

type Employee = {
  id: string;
  matricule: string;
  full_name: string;
  poste: string;
  departement: string | null;
  type_contrat: string | null;
  date_embauche: string;
  statut: string | null;
  genre: string | null;
  date_naissance: string | null;
  email: string | null;
  phone: string | null;
  salaire_brut: number | null;
  manager_id: string | null;
  company_id: string;
  created_at: string | null;
};

const statutVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  actif: "default",
  inactif: "secondary",
  suspendu: "destructive",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

interface Props {
  employees: Employee[];
}

export function EmployeeTable({ employees }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [filterContrat, setFilterContrat] = useState("tous");

  const contrats = useMemo(() => {
    const types = Array.from(new Set(employees.map((e) => e.type_contrat).filter(Boolean))) as string[];
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

  const selectClass =
    "rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (employees.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-16 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium text-muted-foreground">Aucun employé enregistré</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cliquez sur &ldquo;Ajouter un employé&rdquo; pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, poste, matricule, département..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className={selectClass}>
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="suspendu">Suspendu</option>
        </select>
        {contrats.length > 0 && (
          <select value={filterContrat} onChange={(e) => setFilterContrat(e.target.value)} className={selectClass}>
            <option value="tous">Tous les contrats</option>
            {contrats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Résultat */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} employé{filtered.length > 1 ? "s" : ""}
        {search || filterStatut !== "tous" || filterContrat !== "tous" ? " (filtré)" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Aucun employé ne correspond aux critères.
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Matricule</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Poste</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Département</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Contrat</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Embauche</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden xl:table-cell">Salaire brut</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{emp.matricule}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/employes/${emp.id}`} className="hover:text-primary hover:underline transition-colors">
                      {emp.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.poste}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{emp.departement ?? "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {emp.type_contrat ? <Badge variant="outline">{emp.type_contrat}</Badge> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {new Date(emp.date_embauche).toLocaleDateString("fr-CI")}
                  </td>
                  <td className="px-4 py-3 text-right hidden xl:table-cell">
                    {emp.salaire_brut != null ? fmt(emp.salaire_brut) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statutVariant[emp.statut ?? "actif"] ?? "default"}>
                      {emp.statut ?? "actif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <EmployeeDialog employee={emp} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
