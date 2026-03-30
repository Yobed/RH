export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CongesDialog } from "@/components/rh/CongesDialog";
import { CongesApprovalButton } from "@/components/rh/CongesApprovalButton";
import { CalendarDays } from "lucide-react";

export const metadata = { title: "Congés — RH Manager CI" };

const TYPE_LABELS: Record<string, string> = {
  annuel: "Congé annuel",
  maladie: "Maladie",
  maternite: "Maternité",
  paternite: "Paternité",
  sans_solde: "Sans solde",
  exceptionnel: "Exceptionnel",
};

const STATUT_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  demande: "outline",
  approuve: "default",
  refuse: "destructive",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-CI", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function CongesPage() {
  const supabase = createServerClient();

  const [{ data: conges }, { data: employees }] = await Promise.all([
    supabase
      .from("conges")
      .select(`id, type, date_debut, date_fin, nb_jours, statut, commentaire, created_at,
               employees(full_name, matricule)`)
      .order("created_at", { ascending: false }),
    supabase
      .from("employees")
      .select("id, full_name, matricule")
      .eq("statut", "actif")
      .order("full_name"),
  ]);

  const enAttente = conges?.filter((c) => c.statut === "demande") ?? [];
  const historique = conges?.filter((c) => c.statut !== "demande") ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Congés</h1>
          <p className="text-sm text-muted-foreground">
            Droit : 2,2 jours/mois (Art. 25 Code du Travail CI)
          </p>
        </div>
        <CongesDialog employees={employees ?? []} />
      </div>

      {/* Rappel légal */}
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Droits légaux — Code du Travail ivoirien</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <span>📅 Annuel : <strong>26,4 jours/an</strong> (2,2j × 12 mois)</span>
          <span>🤱 Maternité : <strong>14 semaines</strong></span>
          <span>👶 Paternité : <strong>10 jours</strong></span>
        </div>
      </div>

      {/* Demandes en attente */}
      <div>
        <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-amber-500" />
          Demandes en attente
          {enAttente.length > 0 && (
            <Badge variant="outline" className="ml-1">{enAttente.length}</Badge>
          )}
        </h2>

        {enAttente.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucune demande en attente.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employé</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Période</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Jours</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enAttente.map((c) => {
                  const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{emp?.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{emp?.matricule}</p>
                      </td>
                      <td className="px-4 py-3">{TYPE_LABELS[c.type] ?? c.type}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {formatDate(c.date_debut)} → {formatDate(c.date_fin)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{c.nb_jours}j</td>
                      <td className="px-4 py-3">
                        <CongesApprovalButton congeId={c.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historique */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Historique</h2>
        {historique.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucun congé traité.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employé</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Période</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Jours</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {historique.map((c) => {
                  const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{emp?.full_name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[c.type] ?? c.type}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {formatDate(c.date_debut)} → {formatDate(c.date_fin)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{c.nb_jours}j</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUT_VARIANT[c.statut ?? "demande"] ?? "outline"}>
                          {c.statut === "approuve" ? "Approuvé" : c.statut === "refuse" ? "Refusé" : c.statut}
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
