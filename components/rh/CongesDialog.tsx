"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, Info, Paperclip, CheckCircle, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  employees?: Employee[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
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

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024;

export function CongesDialog({
  employees: initialEmployees = [],
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    setControlledOpen?.(newOpen);
  };

  const [fetchedEmployees, setFetchedEmployees] = useState<Employee[]>([]);
  const employees = initialEmployees.length > 0 ? initialEmployees : fetchedEmployees;

  useEffect(() => {
    if (open && initialEmployees.length === 0) {
      fetch("/api/employees")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setFetchedEmployees(data);
        })
        .catch(() => {});
    }
  }, [open, initialEmployees.length]);

  const [solde, setSolde] = useState<SoldeConges | null>(null);
  const [loadingSolde, setLoadingSolde] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!f) { setSelectedFile(null); return; }
    if (!ALLOWED_MIME.includes(f.type)) {
      setFileError("Format invalide. Acceptés : PDF, JPEG, PNG.");
      setSelectedFile(null);
      return;
    }
    if (f.size > MAX_SIZE) {
      setFileError("Fichier trop volumineux (max 10 Mo).");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(f);
  }

  async function onSubmit(data: FormData) {
    const fd = new globalThis.FormData();
    fd.append("employee_id", data.employee_id);
    fd.append("type", data.type);
    fd.append("date_debut", data.date_debut);
    fd.append("date_fin", data.date_fin);
    fd.append("nb_jours", String(Number(data.nb_jours)));
    if (data.commentaire) fd.append("commentaire", data.commentaire);
    fd.append("conge_fractionne", String(data.conge_fractionne ?? false));
    if (data.date_reprise) fd.append("date_reprise", data.date_reprise);
    if (data.remplacant_id) fd.append("remplacant_id", data.remplacant_id);
    if (selectedFile) fd.append("justificatif", selectedFile);

    const res = await fetch("/api/conges", { method: "POST", body: fd });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success("Demande de congé enregistrée — en attente de validation");
    handleOpenChange(false);
    reset();
    setSolde(null);
    setSelectedFile(null);
    setFileError(null);
    onSuccess?.();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center justify-center rounded-2xl bg-[#059669] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#059669]/20 hover:bg-[#047857] transition-all duration-200 gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>Nouvelle demande</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl overflow-hidden rounded-[2rem] border-none p-0 !bg-transparent shadow-none">
        <div className="bg-white border border-slate-200 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh] relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#059669]" />

          {/* En-tête fixe */}
          <DialogHeader className="p-8 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#059669]/10 text-[#059669]">
                <PlusIcon className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                  Nouvelle demande de congé
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  CT-CI 2026 — droit : 2,2 j/mois (26,4 j/an)
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Corps scrollable */}
          <form id="conges-form" onSubmit={handleSubmit(onSubmit)} className="px-8 pb-8 flex-1 overflow-y-auto space-y-6 scrollbar-hide">
            {/* Employé */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">Employé *</Label>
              <Controller
                control={control}
                name="employee_id"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-[#059669] focus:border-[#059669] focus:ring-2">
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-xl rounded-xl z-[9999]">
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id} className="cursor-pointer hover:bg-slate-50 rounded-lg">
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
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">Type de congé *</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-[#059669] focus:border-[#059669] focus:ring-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-xl rounded-xl z-[9999]">
                      {Object.entries(TYPE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val} className="cursor-pointer hover:bg-slate-50 rounded-lg">
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
              <div className={`rounded-xl border p-4 flex gap-3 ${impact.color}`}>
                <Info className="h-5 w-5 mt-0.5 shrink-0 opacity-80" />
                <div>
                  <p className="text-xs font-bold">{impact.label}</p>
                  <p className="text-xs mt-0.5 leading-relaxed opacity-90">{impact.detail}</p>
                </div>
              </div>
            )}

            {/* Solde congés annuels */}
            {typeConge === "annuel" && employeeId && (
              <div className="rounded-xl border bg-emerald-50/70 border-emerald-200 p-4 text-sm">
                {loadingSolde ? (
                  <p className="text-emerald-700 text-xs font-medium">Chargement du solde…</p>
                ) : solde ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] uppercase text-emerald-600 font-bold tracking-wider">Acquis {solde.annee}</p>
                      <p className="text-lg font-bold text-emerald-700">{solde.jours_acquis.toFixed(1)} j</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-emerald-600 font-bold tracking-wider">Pris</p>
                      <p className="text-lg font-bold text-emerald-700">{solde.jours_pris.toFixed(1)} j</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-emerald-700 font-bold tracking-wider">Solde</p>
                      <p className={`text-lg font-bold ${solde.solde <= 0 ? "text-red-600" : "text-emerald-800"}`}>
                        {solde.solde.toFixed(1)} j
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-700 text-xs font-medium">Solde indisponible</p>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Date de départ *</Label>
                <Input
                  type="date"
                  {...register("date_debut")}
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#059669] focus-visible:border-[#059669]"
                  onChange={(e) => {
                    register("date_debut").onChange(e);
                    calcJours(e.target.value, dateFin);
                  }}
                />
                {errors.date_debut && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.date_debut.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Date de fin *</Label>
                <Input
                  type="date"
                  {...register("date_fin")}
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#059669] focus-visible:border-[#059669]"
                  onChange={(e) => {
                    register("date_fin").onChange(e);
                    calcJours(dateDebut, e.target.value);
                  }}
                />
                {errors.date_fin && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.date_fin.message}</p>
                )}
              </div>
            </div>

            {/* Nb jours + reprise */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Nombre de jours *</Label>
                <Input type="number" min="0.5" step="0.5" {...register("nb_jours")} className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#059669] focus-visible:border-[#059669]" />
                {errors.nb_jours && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.nb_jours.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Date de reprise</Label>
                <Input type="date" {...register("date_reprise")} className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#059669] focus-visible:border-[#059669]" />
                <p className="mt-0.5 text-[10px] text-slate-400 font-medium">Auto-calculée — modifiable</p>
              </div>
            </div>

            {/* Fractionné */}
            <label className="flex items-center gap-3 cursor-pointer select-none py-1">
              <input type="checkbox" {...register("conge_fractionne")} className="h-4 w-4 rounded border-slate-300 accent-[#059669] focus:ring-[#059669]" />
              <span className="text-sm font-medium text-slate-700">
                Congé fractionné
                <span className="ml-1.5 text-xs text-slate-400 font-normal">(Art. 25 CT-CI)</span>
              </span>
            </label>

            {/* Remplaçant */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Remplaçant désigné</Label>
              <Controller
                control={control}
                name="remplacant_id"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-[#059669] focus:border-[#059669] focus:ring-2">
                      <SelectValue placeholder="— Aucun / À définir —" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-xl rounded-xl z-[9999]">
                      {employees
                        .filter((e) => e.id !== employeeId)
                        .map((e) => (
                          <SelectItem key={e.id} value={e.id} className="cursor-pointer hover:bg-slate-50 rounded-lg">
                            {e.full_name} {e.matricule ? `(${e.matricule})` : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Justificatif — upload fichier */}
            {needsJustificatif && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">
                  Pièce justificative
                  <span className="ml-1.5 text-xs text-amber-600 font-normal">
                    {typeConge === "maladie" ? "(certificat médical — neutralise la retenue salariale)" : "(pièce obligatoire)"}
                  </span>
                </Label>
                <Input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="cursor-pointer file:cursor-pointer file:bg-[#059669]/10 file:text-[#059669] file:border-none file:rounded-lg file:px-3 file:py-1 file:mr-3 h-12 bg-slate-50/50 border-dashed border-2 border-slate-200 hover:border-[#059669]/40 transition-all pt-2 rounded-xl"
                />
                {fileError ? (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />{fileError}
                  </p>
                ) : selectedFile ? (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />{selectedFile.name}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />PDF, JPG ou PNG · max 10 Mo
                  </p>
                )}
              </div>
            )}

            {/* Commentaire */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Commentaire</Label>
              <Textarea
                {...register("commentaire")}
                placeholder="Motif ou précision..."
                className="min-h-[80px] resize-none rounded-xl border-slate-200 focus-visible:ring-[#059669] focus-visible:border-[#059669]"
              />
            </div>

            <DialogFooter className="pt-4 sticky bottom-0 bg-white -mx-8 px-8 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { handleOpenChange(false); reset(); setSolde(null); }}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                form="conges-form" 
                disabled={isSubmitting} 
                className="h-11 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold px-6 shadow-lg shadow-[#059669]/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? "Enregistrement…" : "Enregistrer la demande"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
