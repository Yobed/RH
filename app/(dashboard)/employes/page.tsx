import { createServerClient } from "@/lib/supabase/server";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import { EmployeeTable } from "@/components/rh/EmployeeTable";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Employés — RH Manager CI" };

const statutVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  actif: "default",
  inactif: "secondary",
  suspendu: "destructive",
};

export default async function EmployesPage() {
  const supabase = createServerClient();

  const { data: employees } = await supabase
    .from("employees")
      .select("*")
    .order("full_name", { ascending: true });

  const total = employees?.length ?? 0;
  const actifs = employees?.filter((e) => e.statut === "actif").length ?? 0;
  const femmes = employees?.filter((e) => e.genre === "F" && e.statut === "actif").length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employés</h1>
          <p className="text-sm text-muted-foreground">
            {actifs} actif{actifs > 1 ? "s" : ""}
            {total !== actifs ? ` · ${total} au total` : ""}
            {actifs > 0 && femmes > 0
              ? ` · ${Math.round((femmes / actifs) * 100)} % femmes`
              : ""}
          </p>
        </div>
        <EmployeeDialog />
      </div>

      <EmployeeTable employees={employees ?? []} />
    </div>
  );
}
