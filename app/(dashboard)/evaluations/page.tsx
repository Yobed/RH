export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EvaluationDialog } from "@/components/rh/EvaluationDialog";
import { EvaluationStatusButton } from "@/components/rh/EvaluationStatusButton";
import { BarChart2 } from "lucide-react";

export const metadata = { title: "Évaluations — RH Manager CI" };

function scoreLabel(score: number | null): string {
  if (score === null) return "Non noté";
  if (score >= 90) return "Exceptionnel";
  if (score >= 75) return "Très satisfaisant";
  if (score >= 60) return "Satisfaisant";
  if (score >= 40) return "À améliorer";
  return "Insuffisant";
}

function scoreVariant(score: number | null): "default" | "secondary" | "outline" | "destructive" {
  if (score === null) return "outline";
  if (score >= 75) return "default";
  if (score >= 40) return "secondary";
  return "destructive";
}

export default async function EvaluationsPage() {
  const supabase = createServerClient();

  const [{ data: evaluations }, { data: employees }] = await Promise.all([
    supabase
      .from("evaluations")
      .select(
        `id, periodicite, periode, date_evaluation, score_global, statut,
         employees!inner(full_name, poste)`
      )
      .order("date_evaluation", { ascending: false })
      .limit(20),
    supabase
      .from("employees")
      .select("id, full_name, poste")
      .eq("statut", "actif")
      .order("full_name"),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Évaluations</h1>
          <p className="text-sm text-muted-foreground">
            Suivi des performances — Mensuel, Trimestriel, Semestriel, Annuel
          </p>
        </div>
        <EvaluationDialog employees={employees ?? []} />
      </div>

      {/* Grille de notation */}
      <div className="rounded-lg border bg-white p-4">
        <p className="mb-3 text-sm font-semibold">Grille de notation (Droit ivoirien)</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>≥ 90 — Exceptionnel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span>≥ 75 — Très satisfaisant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span>≥ 60 — Satisfaisant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
            <span>≥ 40 — À améliorer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span>&lt; 40 — Insuffisant</span>
          </div>
        </div>
      </div>

      {/* Liste des évaluations */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Évaluations récentes</h2>
        {!evaluations || evaluations.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <BarChart2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Aucune évaluation enregistrée</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les évaluations sont générées automatiquement par n8n selon les crons configurés.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employé</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Période</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Périodicité</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {evaluations.map((ev) => {
                  const employee = ev.employees as unknown as { full_name: string; poste: string };
                  return (
                    <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{employee.full_name}</p>
                        <p className="text-xs text-muted-foreground">{employee.poste}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {ev.periode}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {ev.periodicite && (
                          <Badge variant="outline">{ev.periodicite}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ev.score_global != null ? (
                          <div>
                            <span className="font-bold">{ev.score_global}</span>
                            <p className="text-xs text-muted-foreground">
                              {scoreLabel(ev.score_global)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={scoreVariant(ev.score_global)}>
                          {ev.statut}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <EvaluationStatusButton id={ev.id} statut={ev.statut ?? "brouillon"} />
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
