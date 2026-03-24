"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

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
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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

    toast.success("Candidature enregistrée");
    setOpen(false);
    reset();
    router.refresh();
  }

  const postesOuverts = postes.filter((p) => p.statut === "ouvert");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>
        <UserPlus className="mr-2 h-4 w-4" />
        Ajouter un candidat
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nouvelle candidature</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Identité */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Candidat
            </p>

            <div>
              <label className="text-sm font-medium">Nom complet *</label>
              <Input {...register("full_name")} placeholder="Konan Adjoua" className="mt-1" />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="candidat@email.com"
                  className="mt-1"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Téléphone</label>
                <Input
                  {...register("phone")}
                  placeholder="+225 07 00 00 00 00"
                  className="mt-1"
                />
              </div>
            </div>
          </section>

          {/* Offre */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Poste concerné
            </p>

            <div>
              <label className="text-sm font-medium">Offre d'emploi *</label>
              <select {...register("job_id")} className={`mt-1 ${selectClass}`}>
                <option value="">— Sélectionner une offre —</option>
                {postesOuverts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titre}
                  </option>
                ))}
              </select>
              {errors.job_id && (
                <p className="mt-1 text-xs text-red-500">{errors.job_id.message}</p>
              )}
              {postesOuverts.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Aucune offre ouverte — créez d'abord une offre d'emploi.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Lien CV (URL)</label>
              <Input
                {...register("cv_url")}
                placeholder="https://drive.google.com/..."
                className="mt-1"
              />
              {errors.cv_url && (
                <p className="mt-1 text-xs text-red-500">{errors.cv_url.message}</p>
              )}
            </div>
          </section>

          {/* Notes RH */}
          <div>
            <label className="text-sm font-medium">Notes RH</label>
            <Textarea
              {...register("notes_rh")}
              placeholder="Observations, contexte de la candidature..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || postesOuverts.length === 0}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer la candidature"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
