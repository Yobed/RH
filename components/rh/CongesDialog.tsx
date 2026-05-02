"use client";

import { useState, useEffect } from "react";
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
  conge_fractionne: z.boolean().optional(),
  date_reprise: z.string().optional(),
  remplacant_id: z.string().optional(),
  justificatif_url: z.string().max(500).optional(),
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

const TYPES_AVEC_JUSTIFICATIF = ["maladie", "maternite", "paternite"];

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface SoldeConges {
  jours_acquis: number;
  jours_pris: number;
  solde: number;
  annee: number;
}

export function CongesDialog({ employees }: Props) {
  const [open, setOpen] = useState(false);
  const [solde, setSolde] = useState<SoldeConges | null>(null);
  const [loadingSolde, setLoadingSolde] = useState(false);
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
    defaultValues: { type: "annuel", conge_fractionne: false },
  });

  const dateDebut = watch("date_debut");
  const dateFin = watch("date_fin");
  const employeeId = watch("employee_id");
  const typeConge = watch("type");
  const needsJustificatif = TYPES_AVEC_JUSTIFICATIF.includes(typeConge);

  // Calcul automatique du nombre de jours et de la date de reprise
  function calcJours(debut: string, fin: string) {
    if (!debut || !fin) return;
    const d1 = new Date(debut);
    const d2 = new Date(fin);
    if (d2 >= d1) {
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setValue("nb_jours", String(diff));

      // Date de reprise = jour ouvrable suivant la date de fin
      const reprise = new Date(d2);
      reprise.setDate(reprise.getDate() + 1);
      // Si samedi → lundi, si dimanche → lundi
      const jour = reprise.getDay();
      if (jour === 6) reprise.setDate(reprise.getDate() + 2);
      else if (jour === 0) reprise.setDate(reprise.getDate() + 1);
      setValue("date_reprise", reprise.toISOString().split("T")[0]);
    }
  }

  // Suggestion de durée légale pour maternité (14 sem = 98j) et paternité (2j)
  // Art. 27 CT-CI maternité · Art. 25.bis paternité
  useEffect(() => {
    if (!dateDebut) return;
    let durationDays = 0;
    if (typeConge === "maternite") durationDays = 98; // 14 semaines = 98 jours calendaires
    else if (typeConge === "paternite") durationDays = 2; // 2 jours ouvrables (CCI Art. 69)
    else return;

    const debut = new Date(dateDebut);
    if (isNaN(debut.getTime())) return;
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + durationDays - 1);
    setValue("date_fin", fin.toISOString().split("T")[0]);
    setValue("nb_jours", String(durationDays));

    const reprise = new Date(fin);
    reprise.setDate(reprise.getDate() + 1);
    const jour = reprise.getDay();
    if (jour === 6) reprise.setDate(reprise.getDate() + 2);
    else if (jour === 0) reprise.setDate(reprise.getDate() + 1);
    setValue("date_reprise", reprise.toISOString().split("T")[0]);
  }, [typeConge, dateDebut, setValue]);

  // Charger le solde dès qu'un employé est sélectionné (pour congé annuel)
  useEffect(() => {
    if (!employeeId || typeConge !== "annuel") {
      setSolde(null);
      return;
    }
    setLoadingSolde(true);
    fetch(`/api/conges/balance?employee_id=${employeeId}`)
      .then((r) => r.json())
      .then((data: SoldeConges | { error: string }) => {
        if ("solde" in data) setSolde(data);
        else setSolde(null);
      })
      .catch(() => setSolde(null))
      .finally(() => setLoadingSolde(false));
  }, [employeeId, typeConge]);

  async function onSubmit(data: FormData) {
    const payload = {
      employee_id: data.employee_id,
      type: data.type,
      date_debut: data.date_debut,
      date_fin: data.date_fin,
      nb_jours: Number(data.nb_jours),
      commentaire: data.commentaire || undefined,
      conge_fractionne: data.conge_fractionne ?? false,
      date_reprise: data.date_reprise || null,
      remplacant_id: data.remplacant_id || null,
      justificatif_url: data.justificatif_url || null,
    };

    const res = await fetch("/api/conges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success("Demande de congé enregistrée");
    setOpen(false);
    reset();
    setSolde(null);
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

          {/* Information durée légale maternité / paternité */}
          {(typeConge === "maternite" || typeConge === "paternite") && (
            <div className="rounded-md border border-sky-200 bg-sky-50/60 p-3 text-xs text-sky-900">
              {typeConge === "maternite" ? (
                <p>
                  <span className="font-semibold">Maternité :</span> 14 semaines (98 jours calendaires) — Art. 27 CT-CI.
                  Doit comprendre 6 sem avant l'accouchement et 8 sem après.
                  Indemnité 100 % du salaire (50 % CNPS + 50 % employeur).
                </p>
              ) : (
                <p>
                  <span className="font-semibold">Paternité :</span> 2 jours ouvrables — CCI Art. 69 / Ordonnance 2021-902.
                  À prendre dans les 15 jours suivant la naissance.
                </p>
              )}
            </div>
          )}

          {/* Solde de congés affiché si congé annuel */}
          {typeConge === "annuel" && employeeId && (
            <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-3 text-sm">
              {loadingSolde ? (
                <p className="text-emerald-700 text-xs">Chargement du solde…</p>
              ) : solde ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase text-emerald-600 font-semibold tracking-wider">Acquis {solde.annee}</p>
                    <p className="text-base font-bold text-emerald-700">{solde.jours_acquis.toFixed(1)} j</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-emerald-600 font-semibold tracking-wider">Pris</p>
                    <p className="text-base font-bold text-emerald-700">{solde.jours_pris.toFixed(1)} j</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-emerald-700 font-semibold tracking-wider">Solde</p>
                    <p className="text-base font-bold text-emerald-800">{solde.solde.toFixed(1)} j</p>
                  </div>
                </div>
              ) : (
                <p className="text-amber-700 text-xs">Solde indisponible</p>
              )}
            </div>
          )}

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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Nombre de jours *</label>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                {...register("nb_jours")}
                className="mt-1"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Droit : 2,2 jours/mois = 26,4 j/an
              </p>
              {errors.nb_jours && (
                <p className="mt-1 text-xs text-red-500">{errors.nb_jours.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Date de reprise effective</label>
              <Input type="date" {...register("date_reprise")} className="mt-1" />
              <p className="mt-0.5 text-[10px] text-muted-foreground">Auto-calculée — modifiable</p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("conge_fractionne")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">
                Congé fractionné
                <span className="ml-1 text-[10px] text-muted-foreground font-normal">(Art. 25 CT-CI — autorise le fractionnement)</span>
              </span>
            </label>
          </div>

          {/* Remplaçant désigné */}
          <div className="space-y-1">
            <Label>Remplaçant désigné</Label>
            <Controller
              control={control}
              name="remplacant_id"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="— Aucun / À définir —" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter((e) => e.id !== employeeId)
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.full_name} ({e.matricule})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Justificatif (uniquement pour maladie/maternité/paternité) */}
          {needsJustificatif && (
            <div>
              <label className="text-sm font-medium">
                Justificatif (URL / référence)
                <span className="ml-1 text-[10px] text-amber-600 font-normal">
                  {typeConge === "maladie" ? "(certificat médical requis)" : "(pièce justificative requise)"}
                </span>
              </label>
              <Input
                {...register("justificatif_url")}
                placeholder="https://… ou n° certificat médical"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Commentaire</label>
            <Textarea
              {...register("commentaire")}
              placeholder="Motif ou précision..."
              className="mt-1 min-h-[60px]"
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
