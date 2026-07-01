export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PostulerForm } from "@/components/rh/PostulerForm";
import { Briefcase, GraduationCap, Banknote, CalendarDays, Lock } from "lucide-react";

export const metadata = { title: "Postuler — RH Manager CI" };

const fmtXOF = (n: number | null | undefined) =>
  n != null ? new Intl.NumberFormat("fr-CI").format(n) + " FCFA" : null;

interface Props {
  params: { id: string };
}

export default async function PostulerPage({ params }: Props) {
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("job_postings")
    .select("id, titre, description, type_contrat, experience_min, salaire_min, salaire_max, date_limite, statut, competences, company_id")
    .eq("id", params.id)
    .single();

  if (!job) notFound();

  const isOpen = job.statut === "ouvert";
  const competences = (job.competences as string[] | null) ?? [];
  const salaire =
    job.salaire_min || job.salaire_max
      ? `${fmtXOF(job.salaire_min) ?? ""}${job.salaire_max ? " – " + fmtXOF(job.salaire_max) : ""}`
      : null;

  const facts = [
    job.type_contrat && { icon: Briefcase, label: job.type_contrat },
    job.experience_min != null && { icon: GraduationCap, label: `${job.experience_min} an(s) d'expérience` },
    salaire && { icon: Banknote, label: salaire },
    job.date_limite && { icon: CalendarDays, label: `Clôture le ${new Date(job.date_limite).toLocaleDateString("fr-CI")}` },
  ].filter(Boolean) as { icon: typeof Briefcase; label: string }[];

  return (
    <div className="min-h-screen bg-[#f5f6f3]">
      {/* Bandeau */}
      <div className="bg-gradient-to-r from-[#ee7f03] via-[#d67002] to-[#b35c00]">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium text-white">
            <Briefcase className="h-3.5 w-3.5" /> Offre d'emploi
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">{job.titre}</h1>
          {facts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {facts.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[13px] text-white/90">
                  <f.icon className="h-4 w-4" /> {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        {/* Description */}
        {job.description && (
          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 font-display text-lg font-semibold text-slate-900">Description du poste</h2>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700">{job.description}</p>
            {competences.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">Compétences recherchées</p>
                <div className="flex flex-wrap gap-2">
                  {competences.map((c) => (
                    <span key={c} className="rounded-md bg-[#69b5a2]/10 px-2.5 py-1 text-[12px] font-medium text-[#3f7d6e]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Formulaire ou clôture */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          {isOpen ? (
            <>
              <h2 className="mb-1 font-display text-lg font-semibold text-slate-900">Postuler à cette offre</h2>
              <p className="mb-5 text-[13px] text-slate-500">Renseignez vos informations et joignez votre CV.</p>
              <PostulerForm jobId={job.id} />
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Lock className="h-10 w-10 text-slate-400" />
              <h2 className="font-display text-lg font-semibold text-slate-900">Candidatures clôturées</h2>
              <p className="max-w-sm text-[13px] text-slate-500">
                Cette offre n'accepte plus de candidatures pour le moment. Merci de votre intérêt.
              </p>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-[12px] text-slate-400">Propulsé par RH Manager CI</p>
      </div>
    </div>
  );
}
