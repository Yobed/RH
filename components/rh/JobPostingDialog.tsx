"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, X } from "lucide-react";

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

const schema = z.object({
  titre: z.string().min(2, "Titre obligatoire").max(200),
  description: z.string().min(10, "Description obligatoire").max(5000),
  type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage", ""]).optional(),
  experience_min: z.string().optional(),
  salaire_min: z.string().optional(),
  salaire_max: z.string().optional(),
  date_limite: z.string().optional(),
  statut: z.enum(["ouvert", "fermé", "brouillon"]),
  is_internal: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function JobPostingDialog() {
  const [open, setOpen] = useState(false);
  const [competences, setCompetences] = useState<string[]>([]);
  const [competenceInput, setCompetenceInput] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { statut: "ouvert", type_contrat: "", is_internal: false },
  });

  function addCompetence() {
    const val = competenceInput.trim();
    if (val && !competences.includes(val) && competences.length < 20) {
      setCompetences((prev) => [...prev, val]);
      setCompetenceInput("");
    }
  }

  function removeCompetence(c: string) {
    setCompetences((prev) => prev.filter((x) => x !== c));
  }

  function handleCompetenceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCompetence();
    }
  }

  async function onSubmit(data: FormData) {
    const payload = {
      ...data,
      type_contrat: data.type_contrat || null,
      experience_min: data.experience_min ? Number(data.experience_min) : null,
      salaire_min: data.salaire_min ? Number(data.salaire_min) : null,
      salaire_max: data.salaire_max ? Number(data.salaire_max) : null,
      date_limite: data.date_limite || null,
      competences: competences.length > 0 ? competences : null,
      is_internal: data.is_internal ?? false,
    };

    const res = await fetch("/api/recrutement/postes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success("Offre d'emploi créée");
    setOpen(false);
    reset();
    setCompetences([]);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>
        <PlusIcon className="mr-2 h-4 w-4" />
        Nouvelle offre
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nouvelle offre d'emploi</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          {/* Informations principales */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Poste
            </p>

            <div>
              <label className="text-sm font-medium">Intitulé du poste *</label>
              <Input {...register("titre")} placeholder="Comptable Senior" className="mt-1" />
              {errors.titre && (
                <p className="mt-1 text-xs text-red-500">{errors.titre.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                {...register("description")}
                placeholder="Décrivez les missions, responsabilités et profil recherché..."
                className="mt-1 min-h-[120px]"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Type de contrat</label>
                <select {...register("type_contrat")} className={`mt-1 ${selectClass}`}>
                  <option value="">— Choisir —</option>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                  <option value="Apprentissage">Apprentissage</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Expérience minimum (ans)</label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  {...register("experience_min")}
                  placeholder="2"
                  className="mt-1"
                />
              </div>
            </div>
          </section>

          {/* Compétences */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Compétences requises
            </p>
            <div className="flex gap-2">
              <Input
                value={competenceInput}
                onChange={(e) => setCompetenceInput(e.target.value)}
                onKeyDown={handleCompetenceKeyDown}
                placeholder="Ex: Excel, Sage Comptabilité… (Entrée pour ajouter)"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addCompetence}>
                Ajouter
              </Button>
            </div>
            {competences.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {competences.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeCompetence(c)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Conditions */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Conditions & Statut
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Salaire min (FCFA)</label>
                <Input
                  type="number"
                  min="0"
                  step="5000"
                  {...register("salaire_min")}
                  placeholder="150 000"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Salaire max (FCFA)</label>
                <Input
                  type="number"
                  min="0"
                  step="5000"
                  {...register("salaire_max")}
                  placeholder="300 000"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Date limite de candidature</label>
                <Input type="date" {...register("date_limite")} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Statut</label>
                <select {...register("statut")} className={`mt-1 ${selectClass}`}>
                  <option value="ouvert">Ouvert</option>
                  <option value="brouillon">Brouillon</option>
                  <option value="fermé">Fermé</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_internal"
                {...register("is_internal")}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_internal" className="text-sm font-medium leading-none">
                Poste réservé au recrutement interne (Mobilité)
              </label>
            </div>
          </section>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Création..." : "Créer l'offre"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
