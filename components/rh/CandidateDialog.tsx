"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  UserPlus, 
  IdentificationCard, 
  EnvelopeSimple, 
  Phone, 
  Note, 
  Link as LinkIcon,
  CheckCircle,
  Briefcase,
  X
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/types/supabase";

type JobPosting = Pick<Tables<"job_postings">, "id" | "titre" | "statut">;

interface Props {
  postes: JobPosting[];
}

const schema = z.object({
  full_name: z.string().min(2, "Nom obligatoire").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().max(20).optional(),
  job_id: z.string().uuid("Sélectionnez un poste"),
  notes_rh: z.string().max(2000).optional(),
  cv_url: z
    .string()
    .optional()
    .refine((val) => !val || val === "" || z.string().url().safeParse(val).success, {
      message: "URL invalide",
    }),
});

type FormData = z.infer<typeof schema>;

const selectClass =
  "w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-slate-300";

const labelClass = "text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5";

export function CandidateDialog({ postes }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", notes_rh: "", cv_url: "" },
  });

  async function onSubmit(data: FormData) {
    const payload = {
      ...data,
      phone: data.phone || null,
      notes_rh: data.notes_rh || null,
      cv_url: data.cv_url || null,
    };

    try {
      const res = await fetch("/api/recrutement/candidats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur serveur");
        return;
      }

      toast.success("Candidature enregistrée avec succès", {
        icon: <CheckCircle weight="fill" className="text-emerald-500 w-5 h-5" />,
        className: "rounded-2xl border-none shadow-2xl bg-white",
      });
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  }

  const postesOuverts = postes.filter((p) => p.statut === "ouvert");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 transition-all duration-200 gap-2"
        >
          <UserPlus weight="bold" className="h-4 w-4 text-[#059669]" />
          <span>Ajouter un candidat</span>
        </motion.button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl overflow-hidden rounded-[2rem] border-none p-0 !bg-transparent shadow-none">
        <div className="bg-white border border-slate-200 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#059669]" />
          
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#059669]/10 text-[#059669]">
                <IdentificationCard size={28} weight="duotone" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                  Nouveau Candidat
                </DialogTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Enregistrez une nouvelle candidature manuellement
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-8 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
            {/* Identité */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                Informations Personnelles
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    <IdentificationCard weight="duotone" />
                    Nom complet
                  </label>
                  <Input 
                    {...register("full_name")} 
                    placeholder="Konan Adjoua" 
                    className="rounded-xl bg-white border-slate-200 h-11 focus-visible:ring-[#059669]"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                      <X weight="bold" size={12} /> {errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      <EnvelopeSimple weight="duotone" />
                      Email
                    </label>
                    <Input
                      type="email"
                      {...register("email")}
                      placeholder="candidat@email.com"
                      className="rounded-xl h-11 focus-visible:ring-[#059669]"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                        <X weight="bold" size={12} /> {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Phone weight="duotone" />
                      Téléphone
                    </label>
                    <Input
                      {...register("phone")}
                      placeholder="+225 07 00 00 00 00"
                      className="rounded-xl h-11 focus-visible:ring-[#059669]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Offre & Documents */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                Détails de la Candidature
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    <Briefcase weight="duotone" />
                    Offre d'emploi concernée
                  </label>
                  <select {...register("job_id")} className={selectClass}>
                    <option value="">— Sélectionner une offre —</option>
                    {postesOuverts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.titre}
                      </option>
                    ))}
                  </select>
                  {errors.job_id && (
                    <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                      <X weight="bold" size={12} /> {errors.job_id.message}
                    </p>
                  )}
                  {postesOuverts.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 italic">
                      Aucune offre ouverte n'est disponible pour le moment.
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    <LinkIcon weight="duotone" />
                    Lien CV (Drive, Dropbox, Portfolio...)
                  </label>
                  <Input
                    {...register("cv_url")}
                    placeholder="https://drive.google.com/..."
                    className="rounded-xl h-11 focus-visible:ring-[#059669]"
                  />
                  {errors.cv_url && (
                    <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                      <X weight="bold" size={12} /> {errors.cv_url.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes RH */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                Notes & Observations
              </div>
              <div>
                <label className={labelClass}>
                  <Note weight="duotone" />
                  Notes RH initiales
                </label>
                <Textarea
                  {...register("notes_rh")}
                  placeholder="Points forts, contexte, premières impressions..."
                  className="rounded-xl bg-white border-slate-200 min-h-[100px] focus:bg-white focus-visible:ring-[#059669] transition-all"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 sticky bottom-0 bg-white -mx-8 px-8 mt-4 border-t border-slate-100">
              <Button
                type="submit"
                disabled={isSubmitting || postesOuverts.length === 0}
                className="w-full h-12 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold shadow-lg shadow-[#059669]/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer la candidature"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
