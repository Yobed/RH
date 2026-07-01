"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, Scale } from "lucide-react";

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
  reference: z.string().min(1, "Référence obligatoire").max(50),
  titre: z.string().min(3, "Titre obligatoire").max(200),
  type_cas: z.enum(
    ["licenciement", "demission", "discipline", "harcèlement", "accident_travail", "autre"],
    { errorMap: () => ({ message: "Type obligatoire" }) }
  ),
  priorite: z.enum(["haute", "normale", "basse"]),
  description: z.string().max(2000).optional(),
  employee_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

const TYPE_CAS_LABELS: Record<string, string> = {
  licenciement: "Licenciement",
  demission: "Démission",
  discipline: "Procédure disciplinaire",
  "harcèlement": "Harcèlement",
  accident_travail: "Accident du travail",
  autre: "Autre",
};

interface Employee {
  id: string;
  full_name: string;
}

interface Props {
  employees: Employee[];
}

function generateReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900) + 100;
  return `CONT-${year}${month}-${rand}`;
}

export function LegalCaseDialog({ employees }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      reference: generateReference(),
      priorite: "normale",
      type_cas: "licenciement",
      employee_id: "",
    },
  });

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (value) {
      reset({ reference: generateReference(), priorite: "normale", type_cas: "licenciement", employee_id: "" });
    }
  }

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/legal-cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        employee_id: data.employee_id || null,
        description: data.description || null,
      }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success("Dossier de contentieux ouvert");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <PlusIcon className="mr-2 h-4 w-4" />
        Nouveau dossier
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 flex-row items-center gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ee7f03]/10 text-[#d67002] dark:text-[#2dd4bf]">
            <Scale className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <DialogTitle>Nouveau dossier de contentieux</DialogTitle>
            <p className="text-xs text-slate-400">Litige ou inspection — droit du travail ivoirien.</p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-5 py-5">
          {/* Référence & Type */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Référence *</label>
              <Input {...register("reference")} className="mt-1 font-mono" />
              {errors.reference && (
                <p className="mt-1 text-xs text-red-500">{errors.reference.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Type de cas *</label>
              <select {...register("type_cas")} className={`mt-1 ${selectClass}`}>
                {Object.entries(TYPE_CAS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.type_cas && (
                <p className="mt-1 text-xs text-red-500">{errors.type_cas.message}</p>
              )}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="text-sm font-medium">Titre *</label>
            <Input
              {...register("titre")}
              placeholder="Ex : Contestation de licenciement — M. Kouassi"
              className="mt-1"
            />
            {errors.titre && (
              <p className="mt-1 text-xs text-red-500">{errors.titre.message}</p>
            )}
          </div>

          {/* Priorité & Employé */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Priorité</label>
              <select {...register("priorite")} className={`mt-1 ${selectClass}`}>
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Employé concerné</label>
              <select {...register("employee_id")} className={`mt-1 ${selectClass}`}>
                <option value="">— Optionnel —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rappel légal */}
          <div className="rounded-lg border bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
            <p className="font-semibold">Délais — Droit ivoirien (Loi 2015-532)</p>
            <p>Saisine Inspection du Travail : <strong>15 jours</strong></p>
            <p>Prescription : <strong>2 ans</strong></p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              {...register("description")}
              placeholder="Détails du contentieux, faits, chronologie…"
              className="mt-1 resize-none"
              rows={4}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Ouverture..." : "Ouvrir le dossier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
