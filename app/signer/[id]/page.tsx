export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SignerContract } from "@/components/rh/SignerContract";
import { FileSignature, CheckCircle2, Clock } from "lucide-react";

export const metadata = { title: "Signature du contrat — RH Manager CI" };

const fmtXOF = (n: number | null | undefined) =>
  n != null ? new Intl.NumberFormat("fr-CI").format(n) + " FCFA" : "à convenir";

interface Props {
  params: { id: string };
}

export default async function SignerPage({ params }: Props) {
  const admin = createAdminClient();

  const { data: candidate } = await admin
    .from("candidates")
    .select("id, full_name, email, statut, job_id, company_id")
    .eq("id", params.id)
    .single();

  if (!candidate) notFound();

  const [{ data: job }, { data: company }] = await Promise.all([
    candidate.job_id
      ? admin
          .from("job_postings")
          .select("titre, type_contrat, salaire_min, salaire_max")
          .eq("id", candidate.job_id)
          .single()
      : Promise.resolve({ data: null }),
    admin.from("companies").select("nom").eq("id", candidate.company_id).single(),
  ]);

  const employer = (company as { nom?: string } | null)?.nom ?? "l'Employeur";
  const poste = job?.titre ?? "le poste convenu";
  const nature = job?.type_contrat ?? "CDI";
  const salaire = fmtXOF(job?.salaire_min);
  const today = new Date().toLocaleDateString("fr-CI", { day: "2-digit", month: "long", year: "numeric" });

  const signed = candidate.statut === "embauche";
  const ready = candidate.statut === "offre";

  return (
    <div className="min-h-screen bg-[#f5f6f3]">
      <div className="bg-gradient-to-r from-[#ee7f03] via-[#d67002] to-[#b35c00]">
        <div className="mx-auto max-w-3xl px-5 py-9 sm:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium text-white">
            <FileSignature className="h-3.5 w-3.5" /> Contrat de travail
          </span>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {employer} — {poste}
          </h1>
          <p className="mt-1 text-[13px] text-white/85">À l'attention de {candidate.full_name}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        {/* Corps du contrat — modèle Code du Travail ivoirien (ponytail: gabarit, à faire viser juridiquement) */}
        <article className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-[14px] leading-relaxed text-slate-700 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Contrat de travail à durée {nature === "CDD" ? "déterminée" : "indéterminée"}
          </h2>
          <p>
            Le présent contrat est conclu entre <strong>{employer}</strong>, ci-après « l'Employeur », et{" "}
            <strong>{candidate.full_name}</strong> ({candidate.email}), ci-après « le Salarié », dans le respect du{" "}
            <strong>Code du Travail ivoirien</strong> et de la convention collective applicable.
          </p>
          <div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
            <Term label="Poste" value={poste} />
            <Term label="Nature du contrat" value={nature} />
            <Term label="Rémunération brute mensuelle" value={salaire} />
            <Term label="Date d'effet" value={today} />
          </div>
          <p>
            <strong>Article 1 — Fonctions.</strong> Le Salarié exercera les fonctions de {poste} et accomplira les tâches
            correspondantes, sous l'autorité de l'Employeur.
          </p>
          <p>
            <strong>Article 2 — Rémunération.</strong> En contrepartie de son travail, le Salarié percevra une
            rémunération brute mensuelle de {salaire}, payable en fin de mois, sous réserve des cotisations légales (CNPS,
            ITS).
          </p>
          <p>
            <strong>Article 3 — Durée et période d'essai.</strong> Le contrat prend effet à la date indiquée ci-dessus.
            Une période d'essai s'applique conformément à la loi et à la convention collective.
          </p>
          <p>
            <strong>Article 4 — Obligations.</strong> Les parties s'engagent à respecter les dispositions du Code du
            Travail ivoirien, le règlement intérieur et les usages de la profession.
          </p>
        </article>

        {/* Zone de signature */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          {signed ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-11 w-11 text-[#69b5a2]" />
              <h2 className="font-display text-lg font-semibold text-slate-900">Contrat déjà signé</h2>
              <p className="max-w-sm text-[13px] text-slate-500">
                Ce contrat a déjà été signé. Aucune action supplémentaire n'est requise.
              </p>
            </div>
          ) : ready ? (
            <>
              <h2 className="mb-1 font-display text-lg font-semibold text-slate-900">Signature électronique</h2>
              <p className="mb-5 text-[13px] text-slate-500">
                En signant ci-dessous, vous acceptez les termes du contrat.
              </p>
              <SignerContract candidateId={candidate.id} />
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Clock className="h-11 w-11 text-slate-400" />
              <h2 className="font-display text-lg font-semibold text-slate-900">Contrat en préparation</h2>
              <p className="max-w-sm text-[13px] text-slate-500">
                Votre contrat n'est pas encore prêt à la signature. L'équipe RH vous recontactera prochainement.
              </p>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-[12px] text-slate-400">Propulsé par RH Manager CI</p>
      </div>
    </div>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-[14px] font-medium text-slate-900">{value}</p>
    </div>
  );
}
