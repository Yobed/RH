"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, AlertTriangle, Pencil } from "lucide-react";

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

// Durées maximales d'essai par catégorie — Décret n°96-195 du 7 mars 1996
const ESSAI_MOIS: Record<string, number> = {
  "Ouvrier / Employé": 1,
  "Agent de maîtrise / Technicien": 2,
  "Cadre / Ingénieur": 3,
  "Cadre supérieur": 6,
};

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

const schema = z
  .object({
    employee_id: z.string().min(1, "Employé obligatoire"),
    categorie: z.enum([
      "Ouvrier / Employé",
      "Agent de maîtrise / Technicien",
      "Cadre / Ingénieur",
      "Cadre supérieur",
    ]),
    type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage"], {
      errorMap: () => ({ message: "Type de contrat obligatoire" }),
    }),
    date_debut: z.string().min(1, "Date de début obligatoire"),
    date_fin: z.string().optional(),
    date_fin_essai: z.string().optional(),
    salaire_brut: z.string().min(1, "Salaire obligatoire"),
    renouvellement_count: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // date_fin obligatoire pour CDD, Stage, Apprentissage
    if (["CDD", "Stage", "Apprentissage"].includes(data.type_contrat) && !data.date_fin) {
      ctx.addIssue({
        code: "custom",
        message: "Date de fin obligatoire pour CDD, Stage et Apprentissage",
        path: ["date_fin"],
      });
    }
    // date_fin doit être après date_debut
    if (data.date_fin && data.date_debut && data.date_fin <= data.date_debut) {
      ctx.addIssue({
        code: "custom",
        message: "La date de fin doit être postérieure à la date de début",
        path: ["date_fin"],
      });
    }
    // date_fin_essai doit être dans la plage [date_debut, date_fin]
    if (data.date_fin_essai) {
      if (data.date_debut && data.date_fin_essai < data.date_debut) {
        ctx.addIssue({
          code: "custom",
          message: "La fin d'essai ne peut pas être avant la date de début",
          path: ["date_fin_essai"],
        });
      }
      if (data.date_fin && data.date_fin_essai > data.date_fin) {
        ctx.addIssue({
          code: "custom",
          message: "La fin d'essai dépasse la date de fin du contrat",
          path: ["date_fin_essai"],
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

const selectClass =
  "w-full rounded-md border border-input bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

interface Employee {
  id: string;
  full_name: string;
  type_contrat: string | null;
}

export interface ExistingContract {
  id: string;
  employee_id: string;
  type_contrat: "CDI" | "CDD" | "Stage" | "Apprentissage";
  date_debut: string;
  date_fin?: string | null;
  date_fin_essai?: string | null;
  salaire_brut: number;
  renouvellement_count?: number | null;
}

interface Props {
  employees: Employee[];
  defaultEmployeeId?: string;
  contract?: ExistingContract;
}

export function ContractDialog({ employees, defaultEmployeeId, contract }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = !!contract;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? {
          employee_id: contract.employee_id,
          categorie: "Ouvrier / Employé",
          type_contrat: contract.type_contrat,
          date_debut: contract.date_debut,
          date_fin: contract.date_fin ?? "",
          date_fin_essai: contract.date_fin_essai ?? "",
          salaire_brut: String(contract.salaire_brut),
          renouvellement_count: String(contract.renouvellement_count ?? 0),
        }
      : {
          employee_id: defaultEmployeeId ?? "",
          categorie: "Ouvrier / Employé",
          type_contrat: "CDI",
          renouvellement_count: "0",
        },
  });

  const typeContrat = watch("type_contrat");
  const dateDebut = watch("date_debut");
  const categorie = watch("categorie");
  const needsDateFin = ["CDD", "Stage", "Apprentissage"].includes(typeContrat);

  // Auto-calcul fin d'essai quand date_debut ou catégorie change
  useEffect(() => {
    if (!dateDebut) return;
    const mois = ESSAI_MOIS[categorie] ?? 1;
    setValue("date_fin_essai", addMonths(dateDebut, mois));
  }, [dateDebut, categorie, setValue]);

  async function onSubmit(data: FormData) {
    const payload = {
      type_contrat: data.type_contrat,
      date_debut: data.date_debut,
      date_fin: data.date_fin || null,
      date_fin_essai: data.date_fin_essai || null,
      salaire_brut: Number(data.salaire_brut),
      renouvellement_count: Number(data.renouvellement_count ?? 0),
    };

    const url = isEdit ? `/api/contracts/${contract.id}` : "/api/contracts";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEdit ? payload : { ...payload, employee_id: data.employee_id }
      ),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success(isEdit ? "Contrat modifié" : "Contrat créé");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nouveau contrat
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le contrat" : "Nouveau contrat"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Employé — masqué en mode édition */}
          {!isEdit && (
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
          )}

          {/* Catégorie professionnelle */}
          <div>
            <label className="text-sm font-medium">Catégorie professionnelle *</label>
            <select {...register("categorie")} className={`mt-1 ${selectClass}`}>
              <option value="Ouvrier / Employé">Ouvrier / Employé — essai max 1 mois</option>
              <option value="Agent de maîtrise / Technicien">
                Agent de maîtrise / Technicien — essai max 2 mois
              </option>
              <option value="Cadre / Ingénieur">Cadre / Ingénieur — essai max 3 mois</option>
              <option value="Cadre supérieur">Cadre supérieur — essai max 6 mois</option>
            </select>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Détermine la durée d&apos;essai (Décret n°96-195) — la date est calculée automatiquement
            </p>
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
                CDD : max 24 mois renouvellements inclus · max 2 renouvellements.
                Au-delà → conversion CDI automatique (Art. 15 CT-CI 2025).
              </span>
            </div>
          )}

          {/* Dates début / fin */}
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
                min={dateDebut || undefined}
              />
              {errors.date_fin && (
                <p className="mt-1 text-xs text-red-500">{errors.date_fin.message}</p>
              )}
            </div>
          </div>

          {/* Période d'essai / Salaire */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Fin période d&apos;essai</label>
              <Input
                type="date"
                {...register("date_fin_essai")}
                className="mt-1"
                min={dateDebut || undefined}
              />
              {errors.date_fin_essai && (
                <p className="mt-1 text-xs text-red-500">{errors.date_fin_essai.message}</p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                Auto-calculée · modifiable manuellement
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

          {/* Renouvellement CDD uniquement */}
          {typeContrat === "CDD" && (
            <div>
              <label className="text-sm font-medium">Numéro de renouvellement</label>
              <select {...register("renouvellement_count")} className={`mt-1 ${selectClass}`}>
                <option value="0">Contrat initial</option>
                <option value="1">1er renouvellement</option>
                <option value="2">2e renouvellement (dernier autorisé)</option>
              </select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting
                ? isEdit
                  ? "Modification..."
                  : "Enregistrement..."
                : isEdit
                ? "Enregistrer les modifications"
                : "Créer le contrat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
