"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, Info } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

// Impact salaire par type — CT-CI 2026
const IMPACT_SALAIRE: Record<string, { color: string; label: string; detail: string }> = {
  annuel: {
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
    label: "Salaire maintenu à 100%",
    detail: "Congé payé — droit acquis à 2,2 j/mois (Art. 25 CT-CI). L'ICCP est incluse dans le salaire mensuel.",
  },
  maladie: {
    color: "bg-amber-50 border-amber-200 text-amber-800",
    label: "Impact selon justificatif",
    detail: "Avec certificat médical : salaire maintenu (Art. 40 CT-CI). Sans justificatif : retenue des jours d'absence sur le brut.",
  },
  maternite: {
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
    label: "Salaire maintenu à 100%",
    detail: "50 % pris en charge par la CNPS + 50 % par l'employeur (Art. 27 CT-CI). Durée : 14 semaines (98 jours).",
  },
  paternite: {
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
    label: "Salaire maintenu à 100%",
    detail: "2 jours ouvrables à prendre dans les 15 jours suivant la naissance (Ordonnance 2021-902).",
  },
  sans_solde: {
    color: "bg-red-50 border-red-200 text-red-800",
    label: "Aucune rémunération",
    detail: "Retenue intégrale des jours sur le bulletin de paie. Pas de cotisations CNPS sur la période non rémunérée.",
  },
  exceptionnel: {
    color: "bg-sky-50 border-sky-200 text-sky-800",
    label: "Salaire généralement maintenu",
    detail: "Événements familiaux (Art. 26 CT-CI) : décès, mariage, naissance. Durée fixée par la convention collective.",
  },
};

const TYPES_AVEC_JUSTIFICATIF = ["maladie", "maternite", "paternite"];

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
  const impact = IMPACT_SALAIRE[typeConge];

  function calcJours(debut: string, fin: string) {
    if (!debut || !fin) return;
    const d1 = new Date(debut);
    const d2 = new Date(fin);
    if (d2 >= d1) {
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setValue("nb_jours", String(diff));
      const reprise = new Date(d2);
      reprise.setDate(reprise.getDate() + 1);
      const jour = reprise.getDay();
      if (jour === 6) reprise.setDate(reprise.getDate() + 2);
      else if (jour === 0) reprise.setDate(reprise.getDate() + 1);
      setValue("date_reprise", reprise.toISOString().split("T")[0]);
    }
  }

  // Durée légale automatique maternité / paternité
  useEffect(() => {
    if (!dateDebut) return;
    let durationDays = 0;
    if (typeConge === "maternite") durationDays = 98;
    else if (typeConge === "paternite") durationDays = 2;
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

  // Solde congés annuels
  useEffect(() => {
    if (!employeeId || typeConge !== "annuel") { setSolde(null); return; }
    setLoadingSolde(true);
    fetch(`/api/conges/balance?employee_id=${employeeId}`)
      .then((r) => r.json())
      .then((data: SoldeConges | { error: string }) => {
        setSolde("solde" in data ? data : null);
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

    toast.success("Demande de congé enregistrée — en attente de validation");
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

      {/* flex flex-col + pas d'overflow-hidden — évite de clipper les dropdowns */}
      <DialogContent className="sm:max-w-lg p-0 flex flex-col max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl">
        {/* En-tête fixe */}
        <div className="px-6 py-5 border-b border-slate-100 shrink-0">
          <DialogHeader>
            <DialogTitle>Nouvelle demande de congé</DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">CT-CI 2026 — droit : 2,2 j/mois (26,4 j/an)</p>
          </DialogHeader>
        </div>

        {/* Corps scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="conges-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Employé */}
            <div className="space-y-1">
              <Label>Employé *</Label>
              <Controller
                control={control}
                name="employee_id"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-xl z-[9999]">
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id} className="cursor-pointer hover:bg-slate-50">
                          {e.full_name} {e.matricule ? `(${e.matricule})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.employee_id && (
                <p className="text-xs text-red-500 mt-1">{errors.employee_id.message}</p>
              )}
            </div>

            {/* Type */}
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
                    <SelectContent className="bg-white border border-slate-200 shadow-xl z-[9999]">
                      {Object.entries(TYPE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val} className="cursor-pointer hover:bg-slate-50">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Impact salaire par type */}
            {impact && (
              <div className={`rounded-lg border p-3 flex gap-2.5 ${impact.color}`}>
                <Info className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                <div>
                  <p className="text-xs font-semibold">{impact.label}</p>
                  <p className="text-xs mt-0.5 opacity-80">{impact.detail}</p>
                </div>
              </div>
            )}

            {/* Solde congés annuels */}
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
                      <p className={`text-base font-bold ${solde.solde <= 0 ? "text-red-600" : "text-emerald-800"}`}>
                        {solde.solde.toFixed(1)} j
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-700 text-xs">Solde indisponible</p>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Date de départ *</Label>
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
                <Label className="text-sm font-medium">Date de fin *</Label>
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

            {/* Nb jours + reprise */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Nombre de jours *</Label>
                <Input type="number" min="0.5" step="0.5" {...register("nb_jours")} className="mt-1" />
                {errors.nb_jours && (
                  <p className="mt-1 text-xs text-red-500">{errors.nb_jours.message}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Date de reprise</Label>
                <Input type="date" {...register("date_reprise")} className="mt-1" />
                <p className="mt-0.5 text-[10px] text-muted-foreground">Auto-calculée — modifiable</p>
              </div>
            </div>

            {/* Fractionné */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...register("conge_fractionne")} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm">
                Congé fractionné
                <span className="ml-1 text-[10px] text-muted-foreground font-normal">(Art. 25 CT-CI)</span>
              </span>
            </label>

            {/* Remplaçant */}
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
                    <SelectContent className="bg-white border border-slate-200 shadow-xl z-[9999]">
                      {employees
                        .filter((e) => e.id !== employeeId)
                        .map((e) => (
                          <SelectItem key={e.id} value={e.id} className="cursor-pointer hover:bg-slate-50">
                            {e.full_name} {e.matricule ? `(${e.matricule})` : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Justificatif */}
            {needsJustificatif && (
              <div>
                <Label className="text-sm font-medium">
                  Justificatif (URL ou référence)
                  <span className="ml-1 text-[10px] text-amber-600 font-normal">
                    {typeConge === "maladie" ? "(certificat médical — neutralise la retenue)" : "(pièce justificative requise)"}
                  </span>
                </Label>
                <Input
                  {...register("justificatif_url")}
                  placeholder="https://… ou n° certificat médical"
                  className="mt-1"
                />
              </div>
            )}

            {/* Commentaire */}
            <div>
              <Label className="text-sm font-medium">Commentaire</Label>
              <Textarea
                {...register("commentaire")}
                placeholder="Motif ou précision..."
                className="mt-1 min-h-[60px] resize-none"
              />
            </div>
          </form>
        </div>

        {/* Pied fixe */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setOpen(false); reset(); setSolde(null); }}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" form="conges-form" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement…" : "Enregistrer la demande"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
