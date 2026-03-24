import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ContractDialog } from "@/components/rh/ContractDialog";
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

  const { data: contratsExpirants } = await supabase
    .from("contracts")
    .select(
      `id, type_contrat, date_fin, date_fin_essai, renouvellement_count, statut,
       employees!inner(full_name, poste)`
    )
    .eq("statut", "actif")
    .gte("date_fin", today)
    .lte("date_fin", in30Days)
    .order("date_fin", { ascending: true });

  const { data: tousContrats } = await supabase
    .from("contracts")
    .select(
      `id, type_contrat, date_debut, date_fin, salaire_brut, statut, renouvellement_count,
       employees!inner(full_name, poste)`
    )
    .order("created_at", { ascending: false })
    .limit(10);

  function joursRestants(dateFin: string) {
    const diff = Math.ceil(
      (new Date(dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return diff;
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

      {/* Alertes expirations */}
      {contratsExpirants && contratsExpirants.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3 text-amber-700 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {contratsExpirants.length} contrat(s) expirant dans les 30 jours
          </div>
          <div className="space-y-2">
            {contratsExpirants.map((c) => {
              const employee = c.employees as unknown as { full_name: string; poste: string };
              const jours = joursRestants(c.date_fin!);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm border border-amber-100"
                >
                  <div>
                    <span className="font-medium">{employee.full_name}</span>
                    <span className="text-muted-foreground ml-2">— {employee.poste}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c.type_contrat}</Badge>
                    {c.renouvellement_count >= 2 && (
                      <Badge variant="destructive">Conversion CDI requise</Badge>
                    )}
                    <Badge variant={alertVariant(jours)}>
                      J-{jours}
                    </Badge>
                  </div>
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
              Les contrats seront listés ici après création des employés.
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
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden lg:table-cell">Salaire brut</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tousContrats.map((c) => {
                  const employee = c.employees as unknown as { full_name: string; poste: string };
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
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {new Intl.NumberFormat("fr-CI", {
                          style: "currency",
                          currency: "XOF",
                          minimumFractionDigits: 0,
                        }).format(c.salaire_brut)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={c.statut === "actif" ? "default" : "secondary"}
                        >
                          {c.statut}
                        </Badge>
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
