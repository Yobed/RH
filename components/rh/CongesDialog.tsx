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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";
import type { Tables } from "@/types/supabase";

type Employee = Pick<Tables<"employees">, "id" | "full_name" | "matricule">;

interface Props {
  employees: Employee[];
}

const schema = z.object({
  employee_id: z.string().uuid("Sélectionnez un employé"),
  type: z.enum(["annuel", "maladie", "maternite", "paternite", "sans_solde", "exceptionnel"]),
  date_debut: z.string().min(1, "Date de début obligatoire"),
  date_fin: z.string().min(1, "Date de fin obligatoire"),
  nb_jours: z.string().min(1, "Nombre de jours obligatoire"),
  commentaire: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

const TYPE_LABELS: Record<string, string> = {
  annuel: "Congé annuel (Art. 25 CT-CI)",
  maladie: "Congé maladie",
  maternite: "Congé maternité",
  paternite: "Congé paternité",
  sans_solde: "Congé sans solde",
  exceptionnel: "Congé exceptionnel",
};

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function CongesDialog({ employees }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "annuel" },
  });

  const dateDebut = watch("date_debut");
  const dateFin = watch("date_fin");

  // Calcul automatique du nombre de jours
  function calcJours(debut: string, fin: string) {
    if (!debut || !fin) return;
    const d1 = new Date(debut);
    const d2 = new Date(fin);
    if (d2 >= d1) {
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setValue("nb_jours", String(diff));
    }
  }

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/conges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, nb_jours: Number(data.nb_jours) }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success("Demande de congé enregistrée");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nouvelle demande
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de congé</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Employé *</Label>
            <Controller
              control={control}
              name="employee_id"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.full_name} ({e.matricule})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.employee_id && (
              <p className="mt-1 text-xs text-red-500">{errors.employee_id.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Type de congé *</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Date de début *</label>
              <Input
                type="date"
                {...register("date_debut")}
                className="mt-1"
                onChange={(e) => {
                  register("date_debut").onChange(e);
                  calcJours(e.target.value, dateFin);
                }}
              />
              {errors.date_debut && (
                <p className="mt-1 text-xs text-red-500">{errors.date_debut.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Date de fin *</label>
              <Input
                type="date"
                {...register("date_fin")}
                className="mt-1"
                onChange={(e) => {
                  register("date_fin").onChange(e);
                  calcJours(dateDebut, e.target.value);
                }}
              />
              {errors.date_fin && (
                <p className="mt-1 text-xs text-red-500">{errors.date_fin.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Nombre de jours *</label>
            <Input
              type="number"
              min="0.5"
              step="0.5"
              {...register("nb_jours")}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Droit : 2,2 jours/mois = 26,4 jours/an (Légal)
            </p>
            {errors.nb_jours && (
              <p className="mt-1 text-xs text-red-500">{errors.nb_jours.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Commentaire</label>
            <Textarea
              {...register("commentaire")}
              placeholder="Motif ou précision..."
              className="mt-1 min-h-[70px]"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
