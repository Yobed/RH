"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, AlertTriangle } from "lucide-react";

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

const schema = z
  .object({
    employee_id: z.string().min(1, "Employé obligatoire"),
    type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage"], {
      errorMap: () => ({ message: "Type de contrat obligatoire" }),
    }),
    date_debut: z.string().min(1, "Date de début obligatoire"),
    date_fin: z.string().optional(),
    date_fin_essai: z.string().optional(),
    salaire_brut: z.string().min(1, "Salaire obligatoire"),
    renouvellement_count: z.string().optional(),
  })
  .refine(
    (data) => {
      if (["CDD", "Stage", "Apprentissage"].includes(data.type_contrat)) {
        return !!data.date_fin;
      }
      return true;
    },
    {
      message: "Date de fin obligatoire pour CDD, Stage et Apprentissage",
      path: ["date_fin"],
    }
  );

type FormData = z.infer<typeof schema>;

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

interface Employee {
  id: string;
  full_name: string;
  type_contrat: string | null;
}

interface Props {
  employees: Employee[];
  defaultEmployeeId?: string;
}

export function ContractDialog({ employees, defaultEmployeeId }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_id: defaultEmployeeId ?? "",
      type_contrat: "CDI",
      renouvellement_count: "0",
    },
  });

  const typeContrat = watch("type_contrat");
  const needsDateFin = ["CDD", "Stage", "Apprentissage"].includes(typeContrat);

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: data.employee_id,
        type_contrat: data.type_contrat,
        date_debut: data.date_debut,
        date_fin: data.date_fin || null,
        date_fin_essai: data.date_fin_essai || null,
        salaire_brut: Number(data.salaire_brut),
        renouvellement_count: Number(data.renouvellement_count ?? 0),
      }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success("Contrat créé");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon className="mr-2 h-4 w-4" />
        Nouveau contrat
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nouveau contrat</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Employé */}
          <div>
            <label className="text-sm font-medium">Employé *</label>
            <select {...register("employee_id")} className={`mt-1 ${selectClass}`}>
              <option value="">— Sélectionner un employé —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
            {errors.employee_id && (
              <p className="mt-1 text-xs text-red-500">{errors.employee_id.message}</p>
            )}
          </div>

          {/* Type contrat */}
          <div>
            <label className="text-sm font-medium">Type de contrat *</label>
            <select {...register("type_contrat")} className={`mt-1 ${selectClass}`}>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Stage">Stage</option>
              <option value="Apprentissage">Apprentissage</option>
            </select>
            {errors.type_contrat && (
              <p className="mt-1 text-xs text-red-500">{errors.type_contrat.message}</p>
            )}
          </div>

          {/* Alerte CDD */}
          {typeContrat === "CDD" && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                CDD : max 2 ans · max 2 renouvellements (droit ivoirien).
                Au-delà → conversion CDI automatique.
              </span>
            </div>
          )}

          {/* Dates */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Date de début *</label>
              <Input type="date" {...register("date_debut")} className="mt-1" />
              {errors.date_debut && (
                <p className="mt-1 text-xs text-red-500">{errors.date_debut.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">
                Date de fin {needsDateFin ? "*" : ""}
              </label>
              <Input
                type="date"
                {...register("date_fin")}
                className="mt-1"
                disabled={typeContrat === "CDI"}
              />
              {errors.date_fin && (
                <p className="mt-1 text-xs text-red-500">{errors.date_fin.message}</p>
              )}
            </div>
          </div>

          {/* Période d'essai */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Fin période d'essai</label>
              <Input type="date" {...register("date_fin_essai")} className="mt-1" />
              <p className="mt-0.5 text-xs text-muted-foreground">
                CDI : 1 mois ouvriers · 3 mois maîtrise · 6 mois cadres
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Salaire brut (FCFA) *</label>
              <Input
                type="number"
                min="0"
                step="1000"
                {...register("salaire_brut")}
                placeholder="150000"
                className="mt-1"
              />
              {errors.salaire_brut && (
                <p className="mt-1 text-xs text-red-500">{errors.salaire_brut.message}</p>
              )}
            </div>
          </div>

          {/* Renouvellement (CDD seulement) */}
          {typeContrat === "CDD" && (
            <div>
              <label className="text-sm font-medium">Numéro de renouvellement</label>
              <select {...register("renouvellement_count")} className={`mt-1 ${selectClass}`}>
                <option value="0">Contrat initial</option>
                <option value="1">1er renouvellement</option>
                <option value="2">2e renouvellement (dernier)</option>
              </select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Enregistrement..." : "Créer le contrat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
