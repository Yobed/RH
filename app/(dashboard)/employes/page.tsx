import { createServerClient } from "@/lib/supabase/server";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import { EmployeeTable } from "@/components/rh/EmployeeTable";
import { ImportExcelModal } from "@/components/rh/ImportExcelModal";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Employés — RH Manager CI" };

export default async function EmployesPage() {
  const supabase = createServerClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .order("full_name", { ascending: true });

  const total = employees?.length ?? 0;
  const actifs = employees?.filter((e) => e.statut === "actif").length ?? 0;
  const femmes = employees?.filter((e) => e.genre === "F" && e.statut === "actif").length ?? 0;
  const pctFemmes = actifs > 0 && femmes > 0 ? Math.round((femmes / actifs) * 100) : null;

  return (
    <div className="p-6 md:p-8 space-y-6 bg-transparent">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employés</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gestion du personnel</p>
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
          <ImportExcelModal />
          <EmployeeDialog />
        </div>
      </div>

      <EmployeeTable employees={employees ?? []} />
    </div>
  );
}
