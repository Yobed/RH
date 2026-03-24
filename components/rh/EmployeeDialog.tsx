"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, PencilIcon } from "lucide-react";

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

type Employee = Tables<"employees">;

const schema = z.object({
  full_name: z.string().min(2, "Minimum 2 caractères").max(100),
  matricule: z.string().min(1, "Matricule obligatoire").max(20),
  poste: z.string().min(2, "Poste obligatoire").max(100),
  date_embauche: z.string().min(1, "Date d'embauche obligatoire"),
  genre: z.enum(["M", "F", ""]).optional(),
  date_naissance: z.string().optional(),
  departement: z.string().max(100).optional(),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      { message: "Email invalide" }
    ),
  phone: z.string().max(20).optional(),
  type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage", ""]).optional(),
  salaire_brut: z.string().optional(),
  statut: z.enum(["actif", "inactif", "suspendu"]),
});

type FormData = z.infer<typeof schema>;

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function toFormDefaults(emp: Employee): FormData {
  return {
    full_name: emp.full_name,
    matricule: emp.matricule,
    poste: emp.poste,
    date_embauche: emp.date_embauche,
    genre: (emp.genre as "M" | "F" | "") ?? "",
    date_naissance: emp.date_naissance ?? "",
    departement: emp.departement ?? "",
    email: emp.email ?? "",
    phone: emp.phone ?? "",
    type_contrat: (emp.type_contrat as "CDI" | "CDD" | "Stage" | "Apprentissage" | "") ?? "",
    salaire_brut: emp.salaire_brut != null ? String(emp.salaire_brut) : "",
    statut: (emp.statut as "actif" | "inactif" | "suspendu") ?? "actif",
  };
}

function cleanPayload(data: FormData): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => {
      if (v === "" || v === undefined) return [k, null];
      if (k === "salaire_brut") return [k, v ? Number(v) : null];
      return [k, v];
    })
  );
}

interface Props {
  employee?: Employee;
}

export function EmployeeDialog({ employee }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: employee
      ? toFormDefaults(employee)
      : { statut: "actif", genre: "", type_contrat: "" },
  });

  async function onSubmit(data: FormData) {
    const url = employee ? `/api/employees/${employee.id}` : "/api/employees";
    const method = employee ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanPayload(data)),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success(employee ? "Employé modifié" : "Employé ajouté");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          employee ? (
            <Button variant="ghost" size="sm" aria-label="Modifier" />
          ) : (
            <Button />
          )
        }
      >
        {employee ? (
          <PencilIcon className="h-4 w-4" />
        ) : (
          <>
            <PlusIcon className="mr-2 h-4 w-4" />
            Ajouter un employé
          </>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Modifier l'employé" : "Nouvel employé"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          {/* Identité */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Identité
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Nom complet *</label>
                <Input
                  {...register("full_name")}
                  placeholder="Kouassi Jean-Marc"
                  className="mt-1"
                />
                {errors.full_name && (
                  <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Matricule *</label>
                <Input
                  {...register("matricule")}
                  placeholder="CI-2024-001"
                  className="mt-1"
                />
                {errors.matricule && (
                  <p className="mt-1 text-xs text-red-500">{errors.matricule.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Genre</label>
                <select {...register("genre")} className={`mt-1 ${selectClass}`}>
                  <option value="">— Choisir —</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Date de naissance</label>
                <Input type="date" {...register("date_naissance")} className="mt-1" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="jean@entreprise.ci"
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

          {/* Poste */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Poste & Contrat
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Intitulé du poste *</label>
                <Input
                  {...register("poste")}
                  placeholder="Comptable"
                  className="mt-1"
                />
                {errors.poste && (
                  <p className="mt-1 text-xs text-red-500">{errors.poste.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Département</label>
                <Input
                  {...register("departement")}
                  placeholder="Finance"
                  className="mt-1"
                />
              </div>
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
                <label className="text-sm font-medium">Date d'embauche *</label>
                <Input type="date" {...register("date_embauche")} className="mt-1" />
                {errors.date_embauche && (
                  <p className="mt-1 text-xs text-red-500">{errors.date_embauche.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Salaire brut (FCFA)</label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  {...register("salaire_brut")}
                  placeholder="150000"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Statut</label>
                <select {...register("statut")} className={`mt-1 ${selectClass}`}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="suspendu">Suspendu</option>
                </select>
              </div>
            </div>
          </section>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting
                ? "Enregistrement..."
                : employee
                ? "Enregistrer les modifications"
                : "Ajouter l'employé"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
