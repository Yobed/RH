"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, Loader2, FileText } from "lucide-react";

// Formulaire public de candidature à une offre (aucune auth).
export function PostulerForm({ jobId }: { jobId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("job_id", jobId);
      const res = await fetch("/api/recrutement/postuler", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-[#69b5a2]/40 bg-[#69b5a2]/10 px-6 py-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-[#69b5a2]" />
        <h3 className="font-display text-lg font-semibold text-slate-900">Candidature envoyée</h3>
        <p className="max-w-sm text-[13px] text-slate-600">
          Merci ! Votre candidature a bien été reçue. Notre équipe RH l'examinera et reviendra vers vous par email.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[14px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#ee7f03] focus:ring-2 focus:ring-[#ee7f03]/20";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {/* Honeypot anti-spam — masqué aux humains */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="mb-1.5 block text-[13px] font-medium text-slate-700">
            Nom complet <span className="text-[#ee7f03]">*</span>
          </label>
          <input id="full_name" name="full_name" required maxLength={100} className={inputCls} placeholder="Kouassi Aya" />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-[13px] font-medium text-slate-700">
            Téléphone
          </label>
          <input id="phone" name="phone" maxLength={20} className={inputCls} placeholder="+225 07 00 00 00 00" />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-slate-700">
          Email <span className="text-[#ee7f03]">*</span>
        </label>
        <input id="email" name="email" type="email" required className={inputCls} placeholder="aya.kouassi@email.com" />
      </div>

      <div>
        <label htmlFor="cv" className="mb-1.5 block text-[13px] font-medium text-slate-700">
          CV (PDF, DOC ou DOCX — max 5 Mo) <span className="text-[#ee7f03]">*</span>
        </label>
        <label
          htmlFor="cv"
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition-colors hover:border-[#ee7f03] hover:bg-[#ee7f03]/5"
        >
          {fileName ? (
            <FileText className="h-6 w-6 shrink-0 text-[#69b5a2]" />
          ) : (
            <UploadCloud className="h-6 w-6 shrink-0 text-slate-400" />
          )}
          <span className="truncate text-[13px] text-slate-600">
            {fileName ?? "Cliquez pour joindre votre CV"}
          </span>
          <input
            id="cv"
            name="cv"
            type="file"
            required
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? null)}
          />
        </label>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-[13px] font-medium text-slate-700">
          Message (facultatif)
        </label>
        <textarea id="message" name="message" rows={4} maxLength={2000} className={inputCls} placeholder="Quelques mots sur votre motivation…" />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ee7f03] text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#d67002] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…
          </>
        ) : (
          "Envoyer ma candidature"
        )}
      </button>
    </form>
  );
}
