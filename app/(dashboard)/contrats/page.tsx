import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ContractDialog, type ExistingContract } from "@/components/rh/ContractDialog";
import { FileText, AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Contrats — RH Manager CI" };

export default async function ContratsPage() {
  const supabase = createServerClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, type_contrat")
    .eq("statut", "actif")
    .order("full_name");

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Contrats expirant sous 30j avec N+1
  const { data: contratsExpirants } = await supabase
    .from("contracts")
    .select(
      `id, type_contrat, date_fin, date_fin_essai, renouvellement_count, statut,
       employees!inner(id, full_name, poste, manager_id)`
    )
    .eq("statut", "actif")
    .gte("date_fin", today)
    .lte("date_fin", in30Days)
    .order("date_fin", { ascending: true });

  // Récupérer les noms des N+1
  const allManagerIds = contratsExpirants
    ?.map((c) => (c.employees as unknown as { manager_id: string | null }).manager_id)
    .filter((id): id is string => !!id) ?? [];
  const managerIds = Array.from(new Set(allManagerIds));
  const managerNames: Record<string, string> = {};
  if (managerIds.length > 0) {
    const { data: managers } = await supabase
      .from("employees")
      .select("id, full_name")
      .in("id", managerIds);
    managers?.forEach((m) => { managerNames[m.id] = m.full_name; });
  }

  // Tous les contrats récents avec employee_id pour le mode édition
  const { data: tousContrats } = await supabase
    .from("contracts")
    .select(
      `id, employee_id, type_contrat, date_debut, date_fin, date_fin_essai, salaire_brut, statut, renouvellement_count,
       employees!inner(full_name, poste)`
    )
    .order("created_at", { ascending: false })
    .limit(20);

  function joursRestants(dateFin: string) {
    return Math.ceil(
      (new Date(dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }

  function alertVariant(jours: number) {
    if (jours <= 7) return "destructive";
    if (jours <= 15) return "secondary";
    return "outline";
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contrats</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des contrats de travail — CDD, CDI, Stage, Apprentissage
          </p>
        </div>
        <ContractDialog employees={employees ?? []} />
      </div>

      {/* Alertes expirations avec N+1 */}
      {contratsExpirants && contratsExpirants.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3 text-amber-700 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {contratsExpirants.length} contrat(s) expirant dans les 30 jours
          </div>
          <div className="space-y-2">
            {contratsExpirants.map((c) => {
              const emp = c.employees as unknown as {
                id: string;
                full_name: string;
                poste: string;
                manager_id: string | null;
              };
              const jours = joursRestants(c.date_fin!);
              const managerNom = emp.manager_id ? managerNames[emp.manager_id] : null;
              return (
                <div
                  key={c.id}
                  className="rounded bg-white px-3 py-2.5 text-sm border border-amber-100 space-y-1"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-medium">{emp.full_name}</span>
                      <span className="text-muted-foreground ml-2">— {emp.poste}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{c.type_contrat}</Badge>
                      {(c.renouvellement_count ?? 0) >= 2 && (
                        <Badge variant="destructive">Conversion CDI requise</Badge>
                      )}
                      <Badge variant={alertVariant(jours)}>J-{jours}</Badge>
                    </div>
                  </div>
                  {managerNom && (
                    <p className="text-xs text-amber-700">
                      À informer — N+1 : <span className="font-medium">{managerNom}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des contrats */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Contrats récents</h2>
        {!tousContrats || tousContrats.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Aucun contrat enregistré</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les contrats sont créés automatiquement lors de l&apos;ajout d&apos;un employé.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employé</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Début</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Fin</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Fin essai</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden lg:table-cell">Salaire brut</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tousContrats.map((c) => {
                  const employee = c.employees as unknown as { full_name: string; poste: string };
                  const editContract: ExistingContract = {
                    id: c.id,
                    employee_id: c.employee_id,
                    type_contrat: c.type_contrat as ExistingContract["type_contrat"],
                    date_debut: c.date_debut,
                    date_fin: c.date_fin,
                    date_fin_essai: c.date_fin_essai,
                    salaire_brut: c.salaire_brut,
                    renouvellement_count: c.renouvellement_count,
                  };
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{employee.full_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{c.type_contrat}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {new Date(c.date_debut).toLocaleDateString("fr-CI")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {c.date_fin
                          ? new Date(c.date_fin).toLocaleDateString("fr-CI")
                          : "Indéterminé"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {c.date_fin_essai
                          ? new Date(c.date_fin_essai).toLocaleDateString("fr-CI")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {new Intl.NumberFormat("fr-CI", {
                          style: "currency",
                          currency: "XOF",
                          minimumFractionDigits: 0,
                        }).format(c.salaire_brut)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={c.statut === "actif" ? "default" : "secondary"}>
                          {c.statut}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ContractDialog employees={[]} contract={editContract} />
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
