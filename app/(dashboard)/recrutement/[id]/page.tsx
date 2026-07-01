export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { ScoreCvButton } from "@/components/rh/ScoreCvButton";
import { CandidateStatusSelect } from "@/components/rh/CandidateStatusSelect";
import { CandidateDialog } from "@/components/rh/CandidateDialog";
import { CopyLinkButton } from "@/components/rh/CopyLinkButton";
import {
  ArrowLeft, Briefcase, CalendarDays, Banknote, GraduationCap,
  Users, Sparkles, Star, FileText, Building2, Globe,
} from "lucide-react";

const fmtXOF = (n: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

const STAGE_META: Record<string, { label: string; cls: string; dot: string }> = {
  nouveau:   { label: "Nouveau",   cls: "bg-slate-100 text-slate-600 border-slate-200",       dot: "bg-slate-400" },
  en_cours:  { label: "En cours",  cls: "bg-amber-50 text-amber-700 border-amber-200",         dot: "bg-amber-500" },
  shortlist: { label: "Vivier",    cls: "bg-[#ee7f03]/10 text-[#b35c00] border-[#ee7f03]/30",  dot: "bg-[#ee7f03]" },
  entretien: { label: "Entretien", cls: "bg-sky-50 text-sky-700 border-sky-200",               dot: "bg-sky-500" },
  offre:     { label: "Offre",     cls: "bg-[#69b5a2]/12 text-[#3f7d6e] border-[#69b5a2]/40",  dot: "bg-[#69b5a2]" },
  embauche:  { label: "Embauché",  cls: "bg-[#69b5a2]/15 text-[#2f6355] border-[#69b5a2]/50",  dot: "bg-[#3f7d6e]" },
  refus:     { label: "Refusé",    cls: "bg-rose-50 text-rose-700 border-rose-200",            dot: "bg-rose-400" },
};

const JOB_STATUT: Record<string, { label: string; cls: string }> = {
  ouvert:    { label: "Publiée",   cls: "bg-[#69b5a2]/15 text-[#2f6355] border-[#69b5a2]/40" },
  brouillon: { label: "Brouillon", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  "fermé":   { label: "Fermée",    cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

function ScorePill({ score }: { score: number | null }) {
  if (score == null) return <span className="text-[12px] text-slate-300">Non scoré</span>;
  const tone = score >= 80 ? "text-[#3f7d6e]" : score >= 60 ? "text-amber-600" : "text-rose-500";
  return <span className={`font-mono text-[13px] font-bold tabular-nums ${tone}`}>{score}%</span>;
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const [{ data: job }, { data: candidates }] = await Promise.all([
    supabase.from("job_postings").select("*").eq("id", params.id).single(),
    supabase
      .from("candidates")
      .select("id, full_name, email, phone, cv_url, score_ia, statut, notes_rh, created_at")
      .eq("job_id", params.id)
      .order("score_ia", { ascending: false, nullsFirst: false }),
  ]);

  if (!job) notFound();

  const cands = candidates ?? [];
  const scored = cands.filter((c) => c.score_ia != null);
  const scoreMoyen = scored.length ? Math.round(scored.reduce((s, c) => s + (c.score_ia ?? 0), 0) / scored.length) : null;
  const vivier = cands.filter((c) => ["shortlist", "entretien", "offre"].includes(c.statut ?? ""));
  const embauches = cands.filter((c) => c.statut === "embauche");
  const competences = (job.competences as string[] | null) ?? [];
  const statutCfg = JOB_STATUT[job.statut ?? "ouvert"] ?? JOB_STATUT.ouvert;

  return (
    <PageShell>
      <Link href="/recrutement" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-[#b35c00]">
        <ArrowLeft className="h-4 w-4" /> Retour au recrutement
      </Link>

      {/* En-tête offre */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="relative h-20 bg-gradient-to-r from-[#ee7f03] via-[#d67002] to-[#b35c00]">
          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="px-6 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="-mt-10 flex items-end gap-4">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-[#ee7f03] shadow-md ring-4 ring-white dark:ring-slate-900">
                <Briefcase className="h-9 w-9" />
              </span>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{job.titre}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statutCfg.cls}`}>{statutCfg.label}</span>
                  {job.type_contrat && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{job.type_contrat}</span>}
                  <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
                    {job.is_internal ? <><Building2 className="h-3.5 w-3.5" /> Interne</> : <><Globe className="h-3.5 w-3.5" /> Externe</>}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/postuler/${job.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Globe className="h-4 w-4 text-slate-400" /> Page publique
              </a>
              <CopyLinkButton path={`/postuler/${job.id}`} label="Copier le lien" />
              <CandidateDialog postes={[{ id: job.id, titre: job.titre, statut: job.statut }]} />
            </div>
          </div>

          {/* Faits clés */}
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-4">
            <Fact icon={GraduationCap} label="Expérience" value={job.experience_min != null ? `${job.experience_min} an(s)` : "—"} />
            <Fact icon={Banknote} label="Salaire" value={job.salaire_min || job.salaire_max ? `${fmtXOF(job.salaire_min)}${job.salaire_max ? " – " + fmtXOF(job.salaire_max) : ""}` : "—"} />
            <Fact icon={CalendarDays} label="Date limite" value={job.date_limite ? new Date(job.date_limite).toLocaleDateString("fr-CI") : "—"} />
            <Fact icon={Users} label="Candidatures" value={String(cands.length)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-4 lg:col-span-2">
          {/* Description */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-slate-500">
              <FileText className="h-4 w-4 text-[#ee7f03]" /> Descriptif du poste
            </h2>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700 dark:text-slate-300">{job.description || "Aucune description."}</p>
            {competences.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Compétences recherchées</p>
                <div className="flex flex-wrap gap-1.5">
                  {competences.map((c) => (
                    <span key={c} className="rounded-full border border-[#ee7f03]/30 bg-[#ee7f03]/10 px-2.5 py-0.5 text-[12px] font-medium text-[#b35c00]">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Pipeline candidatures */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-slate-500">
                <Users className="h-4 w-4 text-[#ee7f03]" /> Candidatures ({cands.length})
              </h2>
              <span className="text-[12px] text-slate-400">Triées par score IA</span>
            </div>
            {cands.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Users className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                <p className="text-[13px] font-medium text-slate-600">Aucune candidature pour le moment</p>
                <p className="mt-1 text-[12px] text-slate-400">Partage le lien de l'offre ou ajoute un candidat manuellement.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                      <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">Candidat</th>
                      <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide">Score IA</th>
                      <th className="hidden px-3 py-2 text-[11px] font-semibold uppercase tracking-wide sm:table-cell">CV</th>
                      <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">Étape</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cands.map((c) => (
                      <tr key={c.id} className="transition-colors hover:bg-[#ee7f03]/[0.04]">
                        <td className="px-4 py-2.5">
                          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{c.full_name}</p>
                          <p className="text-[11px] text-slate-400">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <ScorePill score={c.score_ia} />
                            <ScoreCvButton candidateId={c.id} hasScore={c.score_ia != null} />
                          </div>
                        </td>
                        <td className="hidden px-3 py-2.5 sm:table-cell">
                          {c.cv_url ? (
                            <a href={c.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#b35c00] hover:underline">
                              <FileText className="h-3.5 w-3.5" /> CV
                            </a>
                          ) : (
                            <span className="text-[12px] text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="w-36"><CandidateStatusSelect candidateId={c.id} currentStatut={c.statut || "nouveau"} /></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Rail : synthèse + vivier */}
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-slate-500">Synthèse du sourcing</h2>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Candidats" value={cands.length} tint="#ee7f03" icon={Users} />
              <MiniStat label="Score moyen" value={scoreMoyen != null ? `${scoreMoyen}%` : "—"} tint="#69b5a2" icon={Sparkles} />
              <MiniStat label="Vivier" value={vivier.length} tint="#ee7f03" icon={Star} />
              <MiniStat label="Embauché(s)" value={embauches.length} tint="#3f7d6e" icon={GraduationCap} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-slate-500">
              <Star className="h-4 w-4 text-[#ee7f03]" /> Vivier — candidats retenus
            </h2>
            {vivier.length === 0 ? (
              <p className="py-4 text-center text-[12px] text-slate-400">Aucun candidat retenu. Score les CV puis passe les meilleurs en « Vivier ».</p>
            ) : (
              <ul className="space-y-2">
                {vivier.map((c) => {
                  const s = STAGE_META[c.statut ?? "shortlist"];
                  return (
                    <li key={c.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ee7f03]/10 text-[11px] font-bold text-[#b35c00]">
                        {c.score_ia != null ? `${c.score_ia}` : "—"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">{c.full_name}</p>
                        <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${s.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
                        </span>
                      </div>
                      {c.cv_url && (
                        <a href={c.cv_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-400 hover:text-[#b35c00]" title="Voir le CV">
                          <FileText className="h-4 w-4" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}

function Fact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><Icon className="h-3 w-3" /> {label}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, tint, icon: Icon }: { label: string; value: string | number; tint: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${tint}1a`, color: tint }}><Icon className="h-3.5 w-3.5" /></span>
      <p className="mt-2 font-display text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}
