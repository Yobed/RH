"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";

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
import type { Tables } from "@/types/supabase";

type Employee = Pick<Tables<"employees">, "id" | "full_name" | "poste">;

interface Props {
  employees: Employee[];
}

const schema = z.object({
  employee_id: z.string().uuid("Sélectionnez un employé"),
  periodicite: z.enum(["mensuel", "trimestriel", "semestriel", "annuel"]),
  periode: z.string().min(1, "Période obligatoire").max(50),
  date_evaluation: z.string().min(1, "Date obligatoire"),
  technique: z.string().optional(),
  comportement: z.string().optional(),
  ponctualite: z.string().optional(),
  initiative: z.string().optional(),
  statut: z.enum(["brouillon", "validé"]),
});

type FormData = z.infer<typeof schema>;

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function ScoreInput({
  label,
  name,
  register,
}: {
  label: string;
  name: "technique" | "comportement" | "ponctualite" | "initiative";
  register: ReturnType<typeof useForm<FormData>>["register"];
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label} (0–100)</label>
      <Input
        type="number"
        min="0"
        max="100"
        step="1"
        {...register(name)}
        placeholder="—"
        className="mt-1"
      />
    </div>
  );
}

export function EvaluationDialog({ employees }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      periodicite: "annuel",
      statut: "brouillon",
      date_evaluation: new Date().toISOString().split("T")[0],
    },
  });

  // Aperçu du score moyen en temps réel
  const [t, c, p, i] = [
    watch("technique"),
    watch("comportement"),
    watch("ponctualite"),
    watch("initiative"),
  ];
  const vals = [t, c, p, i]
    .map(Number)
    .filter((v) => !isNaN(v) && v >= 0 && v <= 100);
  const preview = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;

  async function onSubmit(data: FormData) {
    const scores: Record<string, number> = {};
    if (data.technique) scores.technique = Number(data.technique);
    if (data.comportement) scores.comportement = Number(data.comportement);
    if (data.ponctualite) scores.ponctualite = Number(data.ponctualite);
    if (data.initiative) scores.initiative = Number(data.initiative);

    const payload = {
      employee_id: data.employee_id,
      periodicite: data.periodicite,
      periode: data.periode,
      date_evaluation: data.date_evaluation,
      scores,
      statut: data.statut,
    };

    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success("Évaluation créée");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>
        <PlusIcon className="mr-2 h-4 w-4" />
        Nouvelle évaluation
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nouvelle évaluation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          {/* Employé & période */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Employé & Période
            </p>

            <div>
              <label className="text-sm font-medium">Employé *</label>
              <select {...register("employee_id")} className={`mt-1 ${selectClass}`}>
                <option value="">— Sélectionner —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name} — {e.poste}
                  </option>
                ))}
              </select>
              {errors.employee_id && (
                <p className="mt-1 text-xs text-red-500">{errors.employee_id.message}</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Périodicité *</label>
                <select {...register("periodicite")} className={`mt-1 ${selectClass}`}>
                  <option value="mensuel">Mensuel</option>
                  <option value="trimestriel">Trimestriel</option>
                  <option value="semestriel">Semestriel</option>
                  <option value="annuel">Annuel</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Date d'évaluation *</label>
                <Input type="date" {...register("date_evaluation")} className="mt-1" />
                {errors.date_evaluation && (
                  <p className="mt-1 text-xs text-red-500">{errors.date_evaluation.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Libellé de période *</label>
              <Input
                {...register("periode")}
                placeholder="Ex: T1 2025, Annuel 2024, Jan 2025"
                className="mt-1"
              />
              {errors.periode && (
                <p className="mt-1 text-xs text-red-500">{errors.periode.message}</p>
              )}
            </div>
          </section>

          {/* Critères de notation */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Critères de notation
              </p>
              {preview !== null && (
                <span
                  className={`text-sm font-bold ${
                    preview >= 75
                      ? "text-emerald-600"
                      : preview >= 40
                      ? "text-amber-600"
                      : "text-red-500"
                  }`}
                >
                  Score moyen : {preview}/100
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ScoreInput label="Compétences techniques" name="technique" register={register} />
              <ScoreInput label="Comportement" name="comportement" register={register} />
              <ScoreInput label="Ponctualité" name="ponctualite" register={register} />
              <ScoreInput label="Initiative" name="initiative" register={register} />
            </div>

            <p className="text-xs text-muted-foreground">
              Le score global est la moyenne des critères renseignés.
            </p>
          </section>

          {/* Statut */}
          <div>
            <label className="text-sm font-medium">Statut</label>
            <select {...register("statut")} className={`mt-1 ${selectClass}`}>
              <option value="brouillon">Brouillon</option>
              <option value="validé">Validé</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Enregistrement..." : "Créer l'évaluation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
