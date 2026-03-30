export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { LegalCaseDialog } from "@/components/rh/LegalCaseDialog";
import { CloseLegalCaseButton } from "@/components/rh/CloseLegalCaseButton";
import { Scale } from "lucide-react";

export const metadata = { title: "Contentieux — RH Manager CI" };

const prioriteVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  haute: "destructive",
  normale: "secondary",
  basse: "outline",
};

export default async function ContentieuxPage() {
  const supabase = createServerClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name")
    .order("full_name");

  const { data: cases } = await supabase
    .from("legal_cases")
    .select(
      `id, reference, titre, type_cas, date_ouverture, statut, priorite, description,
       employees(full_name)`
    )
    .order("date_ouverture", { ascending: false });

  const ouverts = cases?.filter((c) => c.statut === "ouvert") ?? [];
  const fermes = cases?.filter((c) => c.statut !== "ouvert") ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contentieux</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des litiges — Droit du Travail ivoirien (Loi 2015-532)
          </p>
        </div>
        <LegalCaseDialog employees={employees ?? []} />
      </div>

      {/* Règles légales ivoiriennes */}
      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-lg border bg-white p-3">
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide mb-1">Préavis CDI</p>
          <p>Ouvriers : <strong>1 mois</strong></p>
          <p>Cadres : <strong>3 mois</strong></p>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide mb-1">Indemnité licenciement</p>
          <p>1/12 salaire annuel × ancienneté</p>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide mb-1">Délais</p>
          <p>Inspection du Travail : <strong>15j</strong></p>
          <p>Prescription : <strong>2 ans</strong></p>
        </div>
      </div>

      {/* Dossiers ouverts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold">Dossiers ouverts</h2>
          {ouverts.length > 0 && (
            <Badge variant="destructive">{ouverts.length}</Badge>
          )}
        </div>

        {ouverts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <Scale className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Aucun contentieux ouvert</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ouverts.map((c) => {
              const employee = Array.isArray(c.employees) ? c.employees[0] : c.employees;
              return (
                <div key={c.id} className="rounded-lg border bg-white p-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{c.reference}</span>
                        {c.type_cas && <Badge variant="outline">{c.type_cas}</Badge>}
                        <Badge variant={prioriteVariant[c.priorite ?? "normale"] ?? "secondary"}>
                          {c.priorite ?? "normale"}
                        </Badge>
                      </div>
                      <p className="mt-1 font-semibold">{c.titre}</p>
                      {employee && (
                        <p className="text-sm text-muted-foreground">
                          Employé concerné : {employee.full_name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-xs text-muted-foreground">
                        Ouvert le {new Date(c.date_ouverture).toLocaleDateString("fr-CI")}
                      </p>
                      <CloseLegalCaseButton caseId={c.id} reference={c.reference} />
                    </div>
                  </div>
                  {c.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dossiers fermés */}
      {fermes.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-muted-foreground">
            Dossiers fermés ({fermes.length})
          </h2>
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Référence</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Titre</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Date ouverture</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fermes.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors text-muted-foreground">
                    <td className="px-4 py-3 font-mono text-xs">{c.reference}</td>
                    <td className="px-4 py-3">{c.titre}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {new Date(c.date_ouverture).toLocaleDateString("fr-CI")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{c.statut}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
