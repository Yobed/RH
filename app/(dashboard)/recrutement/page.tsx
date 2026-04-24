export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { ScoreCvButton } from "@/components/rh/ScoreCvButton";
import { JobPostingDialog } from "@/components/rh/JobPostingDialog";
import { CandidateDialog } from "@/components/rh/CandidateDialog";
import { CandidateStatusSelect } from "@/components/rh/CandidateStatusSelect";

export const metadata = { title: "Recrutement — RH Manager CI" };

const statutConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  nouveau:   { label: "Nouveau",   dot: "bg-slate-400",   text: "text-slate-600",  bg: "bg-slate-50"   },
  en_cours:  { label: "En cours",  dot: "bg-amber-400",   text: "text-amber-700",  bg: "bg-amber-50"   },
  shortlist: { label: "Shortlist", dot: "bg-sky-500",     text: "text-sky-700",    bg: "bg-sky-50"     },
  entretien: { label: "Entretien", dot: "bg-violet-500",  text: "text-violet-700", bg: "bg-violet-50"  },
  offre:     { label: "Offre",     dot: "bg-emerald-500", text: "text-emerald-700",bg: "bg-emerald-50" },
  embauche:  { label: "Embauché",  dot: "bg-green-500",   text: "text-green-700",  bg: "bg-green-50"   },
  refus:     { label: "Refus",     dot: "bg-red-400",     text: "text-red-700",    bg: "bg-red-50"     },
};

export default async function RecrutementPage() {
  const supabase = createServerClient();

  const { data: postes } = await supabase
    .from("job_postings")
    .select("id, titre, type_contrat, statut, date_limite, competences, is_internal")
    .order("created_at", { ascending: false });

  const { data: candidats } = await supabase
    .from("candidates")
    .select(
      `id, full_name, email, score_ia, statut,
       job_postings(titre)`
    )
    .order("created_at", { ascending: false })
    .limit(10);

  const postesOuverts = postes?.filter((p) => p.statut === "ouvert").length ?? 0;
  const candidatsActifs = candidats?.filter((c) => c.statut !== "refus" && c.statut !== "embauche").length ?? 0;
  const scoresIa = candidats?.filter((c) => c.score_ia != null).map((c) => c.score_ia as number) ?? [];
  const scoreMoyen = scoresIa.length > 0
    ? Math.round(scoresIa.reduce((a, b) => a + b, 0) / scoresIa.length)
    : null;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recrutement</h1>
          <p className="text-sm text-slate-400">Offres d'emploi et candidatures avec scoring IA</p>
        </div>
        <div className="flex gap-2">
          <CandidateDialog postes={postes ?? []} />
          <JobPostingDialog />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Postes ouverts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{postesOuverts}</p>
          <p className="mt-1 text-xs text-slate-400">offres actives</p>
        </div>
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Candidats en cours</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{candidatsActifs}</p>
          <p className="mt-1 text-xs text-slate-400">dossiers actifs</p>
        </div>
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Score IA moyen</p>
          <p className={`mt-2 text-3xl font-bold font-mono ${scoreMoyen == null ? "text-slate-300" : scoreMoyen >= 80 ? "text-emerald-600" : scoreMoyen >= 60 ? "text-amber-600" : "text-red-500"}`}>
            {scoreMoyen != null ? scoreMoyen : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-400">sur les 10 derniers</p>
        </div>
      </div>

      {/* Seuils IA */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-sm text-sky-800">
        <p className="font-semibold mb-1.5">Seuils de scoring IA</p>
        <div className="flex gap-5 flex-wrap text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            ≥ 80 → Shortlist
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            ≥ 60 → Entretien
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
            &lt; 60 → Refus
          </span>
        </div>
        <p className="mt-1.5 text-xs text-sky-600">
          Critères : Compétences 35% · Expérience 30% · Formation 20% · Adéquation 15%
        </p>
      </div>

      {/* Postes ouverts */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-800 tracking-tight">Postes ouverts</h2>
        {!postes || postes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <p className="font-medium text-slate-400 text-sm">Aucune offre publiée</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {postes.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900 leading-snug">{p.titre}</p>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        p.statut === "ouvert"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.statut === "ouvert" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {p.statut}
                    </span>
                    {p.is_internal && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-sky-50 text-sky-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Interne
                      </span>
                    )}
                  </div>
                </div>
                {p.type_contrat && (
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{p.type_contrat}</p>
                )}
                {p.date_limite && (
                  <p className="text-xs text-slate-400 mt-auto pt-1 border-t border-slate-50">
                    Limite : <span className="font-medium text-slate-600">{new Date(p.date_limite).toLocaleDateString("fr-CI")}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidatures récentes */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-800 tracking-tight">Candidatures récentes</h2>
        {!candidats || candidats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
            Aucune candidature reçue.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Candidat</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 hidden md:table-cell">Poste</th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">Score IA</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Statut</th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400 hidden md:table-cell">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidats.map((c) => {
                  const rawPoste = c.job_postings;
                  const poste = Array.isArray(rawPoste) ? rawPoste[0] : rawPoste;
                  const statut = c.statut ?? "nouveau";
                  const cfg = statutConfig[statut] ?? statutConfig["nouveau"];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{c.full_name}</p>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {poste?.titre ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.score_ia != null ? (
                          <span
                            className={`font-mono font-bold text-base ${
                              c.score_ia >= 80
                                ? "text-emerald-600"
                                : c.score_ia >= 60
                                ? "text-amber-600"
                                : "text-red-500"
                            }`}
                          >
                            {c.score_ia}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <div className="mt-1">
                          <CandidateStatusSelect
                            candidateId={c.id}
                            currentStatut={statut}
                          />
                        </div>
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
