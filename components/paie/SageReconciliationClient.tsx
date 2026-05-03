"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Users, Link2, AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SageImportDropzone } from "@/components/paie/SageImportDropzone";

interface SageRow {
  sage_employee_id: string;
  employee_name: string | null;
  last_periode: string | null;
  last_net_to_pay: number | null;
}

interface EmployeeSIRH {
  id: string;
  full_name: string;
  matricule: string | null;
}

interface MappingRecord {
  sage_employee_id: string;
  employee_id: string | null;
}

interface Props {
  sageRows: SageRow[];
  employees: EmployeeSIRH[];
  initialMappings: MappingRecord[];
}

const UNSET = "__none__";

export function SageReconciliationClient({ sageRows, employees, initialMappings }: Props) {
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const m of initialMappings) {
      if (m.employee_id) map[m.sage_employee_id] = m.employee_id;
    }
    return map;
  });

  const [pending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const totalSage = sageRows.length;
  const mapped = Object.values(mappings).filter(Boolean).length;
  const unmapped = totalSage - mapped;

  function handleSelectChange(sageEmployeeId: string, value: string | null) {
    setMappings((prev) => ({
      ...prev,
      [sageEmployeeId]: !value || value === UNSET ? "" : value,
    }));
  }

  async function handleAssocier(sageEmployeeId: string) {
    const employeeId = mappings[sageEmployeeId];
    if (!employeeId) {
      toast.error("Sélectionnez un employé SIRH avant d'associer");
      return;
    }

    setSavingId(sageEmployeeId);
    startTransition(async () => {
      try {
        const res = await fetch("/api/paie/sage-mapping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sage_employee_id: sageEmployeeId, employee_id: employeeId }),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          toast.error(json.error ?? "Erreur lors de l'association");
        } else {
          toast.success("Association enregistrée");
        }
      } catch {
        toast.error("Erreur réseau. Veuillez réessayer.");
      } finally {
        setSavingId(null);
      }
    });
  }

  async function handleDissocier(sageEmployeeId: string) {
    setSavingId(sageEmployeeId);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/paie/sage-mapping?sage_id=${encodeURIComponent(sageEmployeeId)}`,
          { method: "DELETE" }
        );
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          toast.error(json.error ?? "Erreur lors de la suppression");
        } else {
          setMappings((prev) => {
            const next = { ...prev };
            delete next[sageEmployeeId];
            return next;
          });
          toast.success("Association supprimée");
        }
      } catch {
        toast.error("Erreur réseau. Veuillez réessayer.");
      } finally {
        setSavingId(null);
      }
    });
  }

  const formatFCFA = (val: number | null) =>
    val == null
      ? "—"
      : new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Import & Réconciliation Sage Paie
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Associez chaque matricule Sage à un employé du SIRH pour réconcilier les données de paie.
          </p>
        </div>
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="shrink-0">
              <Upload className="mr-2 h-4 w-4" />
              Importer un fichier Sage
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Paie Sage</DialogTitle>
            </DialogHeader>
            <SageImportDropzone />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">
            <Users className="h-3.5 w-3.5" />
            Total Sage
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalSage}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium uppercase tracking-wide mb-1">
            <Link2 className="h-3.5 w-3.5" />
            Mappés
          </div>
          <p className="text-2xl font-bold text-emerald-700">{mapped}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-medium uppercase tracking-wide mb-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Non mappés
          </div>
          <p className="text-2xl font-bold text-amber-700">{unmapped}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
        {sageRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
            <Upload className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-medium">Aucune donnée Sage importée</p>
            <p className="text-xs">Importez un fichier Excel Sage pour commencer la réconciliation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    Matricule Sage
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    Nom Sage
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    Dernière période
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    Net à payer
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    Employé SIRH
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sageRows.map((row) => {
                  const currentMapping = mappings[row.sage_employee_id];
                  const isMapped = Boolean(currentMapping);
                  const isSaving = savingId === row.sage_employee_id;

                  return (
                    <tr
                      key={row.sage_employee_id}
                      className={isMapped ? "bg-white" : "bg-amber-50/40"}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
                        {row.sage_employee_id}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.employee_name ?? <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.last_periode ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800 tabular-nums">
                        {formatFCFA(row.last_net_to_pay)}
                      </td>
                      <td className="px-4 py-3 min-w-[220px]">
                        <Select
                          value={currentMapping || UNSET}
                          onValueChange={(val) => handleSelectChange(row.sage_employee_id, val)}
                          disabled={isSaving || pending}
                        >
                          <SelectTrigger className="h-8 text-sm border-slate-200">
                            <SelectValue placeholder="Sélectionner un employé…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNSET}>
                              <span className="text-slate-400 italic">Aucun</span>
                            </SelectItem>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.full_name}
                                {emp.matricule && (
                                  <span className="ml-1.5 text-slate-400 text-xs font-mono">
                                    ({emp.matricule})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        {isMapped ? (
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
                            Mappé
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs">
                            Non mappé
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            disabled={!currentMapping || currentMapping === "" || isSaving || pending}
                            onClick={() => handleAssocier(row.sage_employee_id)}
                          >
                            {isSaving ? "…" : "Associer"}
                          </Button>
                          {isMapped && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                              disabled={isSaving || pending}
                              onClick={() => handleDissocier(row.sage_employee_id)}
                            >
                              Retirer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
