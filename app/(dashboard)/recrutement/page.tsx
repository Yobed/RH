export const dynamic = 'force-dynamic';
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { ScoreCvButton } from "@/components/rh/ScoreCvButton";
import { JobPostingDialog } from "@/components/rh/JobPostingDialog";
import { CandidateDialog } from "@/components/rh/CandidateDialog";
import { CopyLinkButton } from "@/components/rh/CopyLinkButton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell, PageHeader, StatCard } from "@/components/ui/page-shell";
import { CandidateStatusSelect } from "@/components/rh/CandidateStatusSelect";
import { CandidatePipeline } from "@/components/rh/CandidatePipeline";
import { RecrutementViewToggle } from "@/components/rh/RecrutementViewToggle";
import { Info } from "@phosphor-icons/react/dist/ssr";
import { Megaphone, Share2, Sparkles, UserRoundCheck, ArrowRight, Users, Globe, type LucideIcon } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const metadata = { title: "Recrutement — RH Manager CI" };

const statutConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  nouveau:   { label: "Nouveau",   dot: "bg-slate-400",   text: "text-slate-600",  bg: "bg-slate-50"   },
  en_cours:  { label: "En cours",  dot: "bg-amber-400",   text: "text-amber-700",  bg: "bg-amber-50"   },
  shortlist: { label: "Shortlist", dot: "bg-sky-500",     text: "text-sky-700",    bg: "bg-sky-50"     },
  entretien: { label: "Entretien", dot: "bg-slate-500",  text: "text-slate-700", bg: "bg-slate-50"  },
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
      `id, full_name, email, score_ia, statut, job_id,
       job_postings(titre)`
    )
    .order("created_at", { ascending: false });

  const postesOuverts = postes?.filter((p) => p.statut === "ouvert").length ?? 0;
  const candidatsActifs = candidats?.filter((c) => c.statut !== "refus" && c.statut !== "embauche").length ?? 0;
  const scoresIa = candidats?.filter((c) => c.score_ia != null).map((c) => c.score_ia as number) ?? [];
  const scoreMoyen = scoresIa.length > 0
    ? Math.round(scoresIa.reduce((a, b) => a + b, 0) / scoresIa.length)
    : null;

  // Agrégats par offre : nb candidats, nb scorés, score moyen, embauchés.
  const statsByJob = new Map<string, { total: number; scored: number; sumScore: number; embauches: number }>();
  for (const c of candidats ?? []) {
    if (!c.job_id) continue;
    const s = statsByJob.get(c.job_id) ?? { total: 0, scored: 0, sumScore: 0, embauches: 0 };
    s.total += 1;
    if (c.score_ia != null) { s.scored += 1; s.sumScore += c.score_ia as number; }
    if (c.statut === "embauche") s.embauches += 1;
    statsByJob.set(c.job_id, s);
  }

  return (
    <PageShell>
      <PageHeader
        title="Recrutement"
        description="Offres d'emploi et candidatures avec scoring IA"
        actions={
          <>
            <CandidateDialog postes={postes ?? []} />
            <JobPostingDialog />
          </>
        }
      />

      {/* Parcours de recrutement — 4 étapes lisibles */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center">
          <WorkflowStep n={1} icon={Megaphone} title="Publier l'offre" desc="Créez la description du poste" tint="#ee7f03" />
          <StepArrow />
          <WorkflowStep n={2} icon={Share2} title="Diffuser le lien" desc="Les candidats postulent avec leur CV" tint="#ee7f03" />
          <StepArrow />
          <WorkflowStep n={3} icon={Sparkles} title="Scorer les CV" desc="Analyse & tri par l'IA" tint="#69b5a2" />
          <StepArrow />
          <WorkflowStep n={4} icon={UserRoundCheck} title="Recruter & signer" desc="Signature → employé actif" tint="#3f7d6e" />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Postes ouverts" value={postesOuverts} sub="offres actives" tone="brand" />
        <StatCard label="Candidats en cours" value={candidatsActifs} sub="dossiers actifs" />
        <StatCard
          label="Score IA moyen"
          value={scoreMoyen != null ? scoreMoyen : "—"}
          sub="sur les 10 derniers"
          tone={scoreMoyen == null ? "default" : scoreMoyen >= 80 ? "success" : scoreMoyen >= 60 ? "warning" : "danger"}
        />
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

      <RecrutementViewToggle
        candidates={
          candidats?.map((c) => {
            const rawPoste = c.job_postings;
            const poste = Array.isArray(rawPoste) ? (rawPoste as { titre?: string }[])[0] : (rawPoste as { titre?: string } | null);
            return {
              id: c.id,
              full_name: c.full_name,
              poste_souhaite: poste?.titre ?? "Poste non défini",
              score: c.score_ia ?? null,
              statut: c.statut || "nouveau",
              job_id: null,
              created_at: "",
            };
          }) ?? []
        }
        listView={
          <Tabs defaultValue="offres" className="space-y-6">
            <TabsList className="bg-slate-100/50 p-1 rounded-xl">
              <TabsTrigger value="offres" className="rounded-lg px-6">Offres d'emploi</TabsTrigger>
              <TabsTrigger value="pipeline" className="rounded-lg px-6">Pipeline de Talents</TabsTrigger>
              <TabsTrigger value="liste" className="rounded-lg px-6">Liste des Candidats</TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline" className="space-y-4 pt-2">
              <CandidatePipeline
                candidates={candidats?.map(c => ({
                  id: c.id,
                  full_name: c.full_name,
                  email: c.email,
                  score_ia: c.score_ia,
                  statut: c.statut || "nouveau",
                  job_title: (Array.isArray(c.job_postings) ? (c.job_postings as { titre?: string }[])[0]?.titre : (c.job_postings as { titre?: string } | null)?.titre) || "Poste non défini"
                })) || []}
              />
            </TabsContent>

            <TabsContent value="offres" className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {!postes || postes.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState
                      title="Aucune offre d'emploi"
                      description="Publiez une offre pour commencer à recevoir et scorer des candidatures."
                      action={<JobPostingDialog />}
                    />
                  </div>
                ) : (
                  postes.map((p) => {
                    const s = statsByJob.get(p.id) ?? { total: 0, scored: 0, sumScore: 0, embauches: 0 };
                    const avg = s.scored > 0 ? Math.round(s.sumScore / s.scored) : null;
                    const isOpen = p.statut === "ouvert";
                    return (
                      <div
                        key={p.id}
                        className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-[#ee7f03]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                      >
                        {/* Zone cliquable → cockpit de l'offre */}
                        <Link href={`/recrutement/${p.id}`} className="block p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold leading-tight text-slate-900 group-hover:text-[#b35c00] dark:text-white">{p.titre}</p>
                            <span
                              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                                isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-emerald-500" : "bg-slate-400"}`} />
                              {isOpen ? "Publiée" : p.statut}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {p.type_contrat && (
                              <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-slate-500">{p.type_contrat}</span>
                            )}
                            {p.is_internal && (
                              <span className="rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-sky-600">Interne</span>
                            )}
                            {p.date_limite && (
                              <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                                Exp. {new Date(p.date_limite).toLocaleDateString("fr-CI")}
                              </span>
                            )}
                          </div>

                          {/* Indicateurs candidatures + scoring de l'offre */}
                          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                            <OfferMetric icon={Users} value={s.total} label="Candidats" />
                            <OfferMetric icon={Sparkles} value={avg != null ? `${avg}%` : "—"} label={`${s.scored} scorés`} tint="#69b5a2" />
                            <OfferMetric icon={UserRoundCheck} value={s.embauches} label="Embauché" tint="#3f7d6e" />
                          </div>
                        </Link>

                        {/* Barre d'actions — diffusion du lien de candidature */}
                        <div className="mt-auto flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                          <CopyLinkButton path={`/postuler/${p.id}`} label="Lien candidature" />
                          <a
                            href={`/postuler/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            title="Ouvrir la page publique de candidature"
                          >
                            <Globe className="h-4 w-4 text-slate-400" />
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="liste" className="space-y-4 pt-2">
              <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Candidat</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Poste</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Score IA</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Statut</th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {candidats?.map((c) => {
                        const rawPoste = c.job_postings;
                        const poste = Array.isArray(rawPoste) ? (rawPoste as { titre?: string }[])[0] : (rawPoste as { titre?: string } | null);
                        return (
                          <tr key={c.id} className="transition-colors hover:bg-[#ee7f03]/[0.04]">
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 leading-tight">{c.full_name}</span>
                                <span className="text-[11px] text-slate-500">{c.email}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-medium text-slate-600 bg-slate-100/80 px-2 py-1 rounded-lg">
                                {poste?.titre ?? "—"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <ScoreCvButton candidateId={c.id} hasScore={c.score_ia != null} />
                              {c.score_ia != null && (
                                <span className="ml-2 font-mono font-bold text-xs text-slate-600">{c.score_ia}%</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="w-32">
                                <CandidateStatusSelect candidateId={c.id} currentStatut={c.statut || "nouveau"} />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button className="text-slate-400 hover:text-[#ee7f03] p-1.5 rounded-lg hover:bg-slate-100 transition-all">
                                <Info size={18} weight="bold" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        }
      />
    </PageShell>
  );
}

function WorkflowStep({
  n,
  icon: Icon,
  title,
  desc,
  tint,
}: {
  n: number;
  icon: LucideIcon;
  title: string;
  desc: string;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
        style={{ backgroundColor: tint }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold leading-tight text-slate-900 dark:text-white">
          {n}. {title}
        </p>
        <p className="truncate text-[11px] text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function StepArrow() {
  return <ArrowRight className="mx-auto hidden h-4 w-4 shrink-0 text-slate-300 sm:block" />;
}

function OfferMetric({
  icon: Icon,
  value,
  label,
  tint = "#ee7f03",
}: {
  icon: LucideIcon;
  value: number | string;
  label: string;
  tint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <Icon className="h-4 w-4" style={{ color: tint }} />
      <span className="text-[15px] font-bold leading-none text-slate-900 dark:text-white">{value}</span>
      <span className="text-[10px] leading-tight text-slate-400">{label}</span>
    </div>
  );
}
