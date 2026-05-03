import { createServerClient } from "@/lib/supabase/server";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import { EmployeeTable } from "@/components/rh/EmployeeTable";
import { ImportExcelModal } from "@/components/rh/ImportExcelModal";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Employés — RH Manager CI" };

export default async function EmployesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createServerClient();

  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const limit = 10;
  const offset = (Math.max(1, page) - 1) * limit;

  const query = typeof searchParams.q === "string" ? searchParams.q : "";
  const statut = typeof searchParams.statut === "string" ? searchParams.statut : "tous";
  const contrat = typeof searchParams.contrat === "string" ? searchParams.contrat : "tous";
  const sortCol = typeof searchParams.sort === "string" ? searchParams.sort : "full_name";
  const sortDir = typeof searchParams.dir === "string" ? searchParams.dir : "asc";

  let dbQuery = supabase
    .from("employees")
    .select("*", { count: "exact" });

  if (query) {
    dbQuery = dbQuery.or(`full_name.ilike.%${query}%,matricule.ilike.%${query}%,poste.ilike.%${query}%,departement.ilike.%${query}%`);
  }

  if (statut !== "tous") {
    dbQuery = dbQuery.eq("statut", statut);
  }

  if (contrat !== "tous") {
    dbQuery = dbQuery.eq("type_contrat", contrat);
  }

  const validSortCols = ["full_name", "matricule", "type_contrat", "salaire_brut", "statut"];
  const safeSortCol = validSortCols.includes(sortCol) ? sortCol : "full_name";

  dbQuery = dbQuery.order(safeSortCol, { ascending: sortDir === "asc" });
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data: employees, count } = await dbQuery;

  // Lightweight fetch for dialogs (to list managers, etc.)
  const { data: allEmployees } = await supabase
    .from("employees")
    .select("id, full_name, statut, type_contrat")
    .order("full_name", { ascending: true });

  // KPIs
  const { count: totalActifs } = await supabase.from("employees").select("*", { count: "exact", head: true }).eq("statut", "actif");
  const { count: totalFemmes } = await supabase.from("employees").select("*", { count: "exact", head: true }).eq("statut", "actif").eq("genre", "F");
  
  const total = allEmployees?.length ?? 0;
  const actifs = totalActifs ?? 0;
  const femmes = totalFemmes ?? 0;
  const pctFemmes = actifs > 0 && femmes > 0 ? Math.round((femmes / actifs) * 100) : null;

  return (
    <div className="p-6 md:p-8 space-y-6 bg-transparent">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employés</h1>
          <p className="text-sm text-slate-600 mt-0.5">Gestion du personnel</p>
          {/* Mini KPIs inline */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
              <span className="text-sm text-slate-600">
                <span className="font-semibold font-mono tabular-nums text-slate-900">{total}</span>
                {" "}au total
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-sm text-slate-600">
                <span className="font-semibold font-mono tabular-nums text-slate-900">{actifs}</span>
                {" "}actif{actifs > 1 ? "s" : ""}
              </span>
            </div>
            {pctFemmes !== null && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-400 shrink-0" />
                <span className="text-sm text-slate-600">
                  <span className="font-semibold font-mono tabular-nums text-slate-900">{pctFemmes} %</span>
                  {" "}femmes
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <a
            href="/api/employees/export?statut=actif"
            download
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exporter Excel
          </a>
          <ImportExcelModal />
          <EmployeeDialog employees={allEmployees ?? []} />
        </div>
      </div>

      {!employees || employees.length === 0 ? (
        <EmptyState
          icon={<Users className="h-14 w-14 text-slate-300" />}
          title="Aucun collaborateur"
          description="Votre base de données est vide ou aucun résultat ne correspond à votre recherche."
          action={
            <div className="flex gap-2">
              <ImportExcelModal />
              <EmployeeDialog employees={allEmployees ?? []} />
            </div>
          }
        />
      ) : (
        <EmployeeTable employees={employees} totalCount={count ?? 0} allEmployees={allEmployees ?? []} />
      )}
    </div>
  );
}
