export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ScoreCvButton } from "@/components/rh/ScoreCvButton";
import { JobPostingDialog } from "@/components/rh/JobPostingDialog";
import { CandidateDialog } from "@/components/rh/CandidateDialog";
import { CandidateStatusSelect } from "@/components/rh/CandidateStatusSelect";
import { UserPlus } from "lucide-react";

export const metadata = { title: "Recrutement — RH Manager CI" };

const statutColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  nouveau: "outline",
  en_cours: "secondary",
  shortlist: "default",
  entretien: "default",
  offre: "default",
  embauche: "default",
  refus: "destructive",
};

export default async function RecrutementPage() {
  const supabase = createServerClient();

  const { data: postes } = await supabase
    .from("job_postings")
    .select("id, titre, type_contrat, statut, date_limite, competences")
    .order("created_at", { ascending: false });

  const { data: candidats } = await supabase
    .from("candidates")
    .select(
      `id, full_name, email, score_ia, statut,
       job_postings(titre)`
    )
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recrutement</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des offres d'emploi et candidatures avec scoring IA
          </p>
        </div>
        <div className="flex gap-2">
          <CandidateDialog postes={postes ?? []} />
          <JobPostingDialog />
        </div>
      </div>

      {/* Rappel des seuils (droit ivoirien) */}
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Seuils de scoring IA</p>
        <div className="flex gap-4 flex-wrap">
          <span>≥ 80 → <Badge>Shortlist</Badge></span>
          <span>≥ 60 → <Badge variant="secondary">Entretien</Badge></span>
          <span>&lt; 60 → <Badge variant="destructive">Refus</Badge></span>
        </div>
        <p className="mt-1 text-xs text-blue-600">
          Critères : Compétences 35% · Expérience 30% · Formation 20% · Adéquation 15%
        </p>
      </div>

      {/* Postes ouverts */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Postes ouverts</h2>
        {!postes || postes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <UserPlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Aucune offre publiée</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {postes.map((p) => (
              <div key={p.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{p.titre}</p>
                  <Badge variant={p.statut === "ouvert" ? "default" : "secondary"}>
                    {p.statut}
                  </Badge>
                </div>
                {p.type_contrat && (
                  <p className="mt-1 text-xs text-muted-foreground">{p.type_contrat}</p>
                )}
                {p.date_limite && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Limite : {new Date(p.date_limite).toLocaleDateString("fr-CI")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidatures récentes */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Candidatures récentes</h2>
        {!candidats || candidats.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
            Aucune candidature reçue.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Candidat</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Poste</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Score IA</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden md:table-cell">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {candidats.map((c) => {
                  const poste = c.job_postings as unknown as { titre: string } | null;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {poste?.titre ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.score_ia != null ? (
                          <span
                            className={
                              c.score_ia >= 80
                                ? "font-bold text-emerald-600"
                                : c.score_ia >= 60
                                ? "font-bold text-amber-600"
                                : "font-bold text-red-500"
                            }
                          >
                            {c.score_ia}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <CandidateStatusSelect
                          candidateId={c.id}
                          currentStatut={c.statut ?? "nouveau"}
                        />
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <ScoreCvButton
                          candidateId={c.id}
                          hasScore={c.score_ia != null}
                        />
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
