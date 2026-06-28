import { createServerClient } from "@/lib/supabase/server";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import { EmployeeTable } from "@/components/rh/EmployeeTable";
import { ImportExcelModal } from "@/components/rh/ImportExcelModal";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import { 
  Users, 
  Download, 
  IdentificationBadge
} from "@phosphor-icons/react/dist/ssr";

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
    .select("id, full_name, statut, type_contrat, departement, genre, poste")
    .order("full_name", { ascending: true });

  // KPIs
  const { count: totalActifs } = await supabase.from("employees").select("*", { count: "exact", head: true }).eq("statut", "actif");
  const { count: totalFemmes } = await supabase.from("employees").select("*", { count: "exact", head: true }).eq("statut", "actif").eq("genre", "F");
  const { count: totalCDI } = await supabase.from("employees").select("*", { count: "exact", head: true }).eq("type_contrat", "CDI");
  
  const total = allEmployees?.length ?? 0;
  const actifs = totalActifs ?? 0;
  const femmes = totalFemmes ?? 0;
  const cdiCount = totalCDI ?? 0;
  const pctFemmes = actifs > 0 && femmes > 0 ? Math.round((femmes / actifs) * 100) : 0;

  const stats = {
    total,
    actifs,
    cdiCount,
    pctFemmes,
    femmes
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Effectif RH"
        eyebrowIcon={<IdentificationBadge size={14} weight="bold" className="text-[#059669]" />}
        title="Gestion des Collaborateurs"
        help="Le registre de votre personnel : chaque fiche regroupe le contrat, les documents, les congés et l'historique du salarié."
        actions={
          <>
            <a
              href="/api/employees/export?statut=actif"
              download
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs active:scale-[0.98]"
            >
              <Download size={16} className="text-slate-500" weight="bold" />
              <span>Exporter</span>
            </a>
            <ImportExcelModal />
            <EmployeeDialog employees={allEmployees ?? []} />
          </>
        }
      />

      {/* Unified Master Workstation Shell */}
      {(!employees || employees.length === 0) && !query && statut === "tous" && contrat === "tous" ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 shadow-2xs">
          <EmptyState
            icon={<Users size={56} className="text-slate-300" weight="duotone" />}
            title="Aucun collaborateur trouvé"
            description="Votre base de données ne contient aucun résultat correspondant aux filtres actifs."
            action={
              <div className="flex gap-3">
                <ImportExcelModal />
                <EmployeeDialog employees={allEmployees ?? []} />
              </div>
            }
          />
        </div>
      ) : (
        <EmployeeTable
          employees={employees ?? []}
          totalCount={count ?? 0}
          allEmployees={allEmployees ?? []}
          stats={stats}
        />
      )}
    </PageShell>
  );
}


