"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CaretUp, CaretDown, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { PaieDialog } from "@/components/rh/PaieDialog";
import { PaieStatusButton } from "@/components/rh/PaieStatusButton";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileText } from "@phosphor-icons/react";

// « validé » = validé mais pas encore payé → ton ambre (intermédiaire), pas vert.
const StatutBadge = ({ statut }: { statut: string }) => {
  const tone = statut === "payé" ? "success" : statut === "validé" ? "warning" : "neutral";
  return <StatusBadge status={statut} tone={tone} />;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

const formatPeriode = (p: string) => {
  if (!p) return "";
  const [yyyy, mm] = p.split("-");
  const d = new Date(parseInt(yyyy), parseInt(mm) - 1);
  const m = d.toLocaleDateString("fr-CI", { month: "short" }).replace('.', '');
  return `${m} ${yyyy}`;
};

export function BulletinTable({ bulletins, employees, company, totalCount }: { bulletins: any[], employees: any[], company: any, totalCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const sortColumn = searchParams.get("sort") || "";
  const sortDir = searchParams.get("dir") || "asc";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const handleSort = (col: string) => {
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
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <CaretDown className="opacity-20 ml-1 inline" size={12} />;
    return sortDir === "asc" ? (
      <CaretUp className="opacity-100 ml-1 inline text-slate-900" size={12} weight="bold" />
    ) : (
      <CaretDown className="opacity-100 ml-1 inline text-slate-900" size={12} weight="bold" />
    );
  };

  if (bulletins.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-14 w-14 text-slate-300" weight="duotone" />}
        title="Aucun bulletin de paie"
        description="Aucun bulletin de paie n'a été généré pour cette période ou ce collaborateur."
      />
    );
  }

  return (
    <div className={`overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${isPending ? 'opacity-60 pointer-events-none' : ''} transition-opacity duration-200`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
            <tr>
              <th 
                className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 cursor-pointer hover:text-slate-900 transition-colors"
                onClick={() => handleSort("full_name")}
              >
                Employé <SortIcon column="full_name" />
              </th>
              <th 
                className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 cursor-pointer hover:text-slate-900 transition-colors"
                onClick={() => handleSort("periode")}
              >
                Période <SortIcon column="periode" />
              </th>
              <th 
                className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell cursor-pointer hover:text-slate-900 transition-colors"
                onClick={() => handleSort("gross_salary")}
              >
                *** BRUT *** <SortIcon column="gross_salary" />
              </th>
              <th 
                className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell cursor-pointer hover:text-slate-900 transition-colors"
                onClick={() => handleSort("withholding_cnps")}
              >
                Ret. CNPS <SortIcon column="withholding_cnps" />
              </th>
              <th 
                className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell cursor-pointer hover:text-slate-900 transition-colors"
                onClick={() => handleSort("tax_igr")}
              >
                IGR <SortIcon column="tax_igr" />
              </th>
              <th 
                className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500 cursor-pointer hover:text-slate-900 transition-colors"
                onClick={() => handleSort("net_to_pay")}
              >
                NET A PAYER <SortIcon column="net_to_pay" />
              </th>
              <th 
                className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 cursor-pointer hover:text-slate-900 transition-colors"
                onClick={() => handleSort("statut")}
              >
                Statut <SortIcon column="statut" />
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500 min-w-[130px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bulletins.map((b) => {
              const empRaw = b.employees;
              const emp = Array.isArray(empRaw) ? empRaw[0] : empRaw;
              const detailsObj = b.details as { heures_sup?: { h15: number, h50: number, h75: number }; nb_jours_absence?: number } | null;
              return (
                <tr key={b.id} className="group transition-colors hover:bg-[#ee7f03]/[0.04]">
                  <td className="px-3 py-1.5 text-[13px]">
                    <p className="font-semibold text-slate-800">{emp?.full_name ?? "—"}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{emp?.matricule}</p>
                  </td>
                  <td className="px-3 py-1.5 text-[13px] font-mono tabular-nums text-xs uppercase tracking-wider text-slate-600">
                    {formatPeriode(b.periode)}
                  </td>
                  <td className="px-3 py-1.5 text-[13px] text-right hidden lg:table-cell font-mono tabular-nums text-slate-600">{fmt(Number((b as Record<string, unknown>).gross_salary ?? b.salaire_brut))}</td>
                  <td className="px-3 py-1.5 text-[13px] text-right font-mono tabular-nums text-rose-500 hidden lg:table-cell">− {fmt(Number((b as Record<string, unknown>).withholding_cnps ?? b.cnps_salarie))}</td>
                  <td className="px-3 py-1.5 text-[13px] text-right font-mono tabular-nums text-rose-500 hidden lg:table-cell">− {fmt(Number((b as Record<string, unknown>).tax_igr ?? b.its))}</td>
                  <td className="px-3 py-1.5 text-[13px] text-right font-bold font-mono tabular-nums text-emerald-700">{fmt(Number((b as Record<string, unknown>).net_to_pay ?? b.salaire_net))}</td>
                  <td className="px-3 py-1.5 text-[13px]">
                    <StatutBadge statut={b.statut ?? "brouillon"} />
                  </td>
                  <td className="px-3 py-1.5 text-[13px] text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {b.statut === "brouillon" && (
                        <PaieDialog
                          employees={employees ?? []}
                          company={company}
                          bulletin={{
                            id: b.id,
                            periode: b.periode,
                            employee_id: (b as Record<string, unknown>).employee_id as string,
                            employee_name: emp?.full_name ?? "—",
                            salaire_brut: Number(b.salaire_brut),
                            sursalaire: Number((b as Record<string, unknown>).sursalaire ?? 0),
                            prime_anciennete: Number((b as Record<string, unknown>).prime_anciennete ?? 0),
                            prime_exceptionnelle: Number((b as Record<string, unknown>).prime_exceptionnelle ?? 0),
                            prime_salissure: Number((b as Record<string, unknown>).prime_salissure ?? 0),
                            prime_depassement: Number((b as Record<string, unknown>).prime_depassement ?? 0),
                            prime_fonction: Number((b as Record<string, unknown>).prime_fonction ?? 0),
                            prime_transport: Number((b as Record<string, unknown>).prime_transport ?? 0),
                            vacation_allowance: Number((b as Record<string, unknown>).vacation_allowance ?? 0),
                            heures_sup_h15: detailsObj?.heures_sup?.h15 ?? 0,
                            heures_sup_h50: detailsObj?.heures_sup?.h50 ?? 0,
                            heures_sup_h75: detailsObj?.heures_sup?.h75 ?? 0,
                            autres_retenues: Number(b.autres_retenues ?? 0),
                            avances: Number(b.avances ?? 0),
                            nb_jours_absence: detailsObj?.nb_jours_absence ?? 0,
                          }}
                        />
                      )}
                      <PaieStatusButton bulletinId={b.id} currentStatut={b.statut ?? "brouillon"} />
                      <Link
                        href={`/paie/${b.id}/print`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        Imprimer
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-50 flex items-center justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
            {totalCount} bulletin{totalCount > 1 ? 's' : ''} indexé{totalCount > 1 ? 's' : ''}
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
