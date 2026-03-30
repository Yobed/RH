"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, PencilIcon, RefreshCw } from "lucide-react";

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

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const schema = z
  .object({
    civilite: z.enum(["M.", "Mme", "Mlle", ""]).optional(),
    full_name: z.string().min(2, "Minimum 2 caractères").max(100),
    matricule: z.string().max(20).optional(),
    genre: z.enum(["M", "F", ""]).optional(),
    date_naissance: z.string().optional(),
    nationalite: z.string().max(100).optional(),
    etat_civil: z.enum(["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf/Veuve", "Pacsé(e)", ""]).optional(),
    nb_enfants: z.string().optional(),
    email: z
      .string()
      .optional()
      .refine(
        (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Email invalide" }
      ),
    phone: z.string().max(20).optional(),
    poste: z.string().min(2, "Poste obligatoire").max(100),
    departement: z.string().max(100).optional(),
    niveau_etude: z.enum(["Primaire", "Secondaire/Collège", "BAC", "BTS / DUT", "Licence", "Master", "Doctorat", ""]).optional(),
    categorie: z.enum(["Ouvrier / Employé", "Agent de maîtrise / Technicien", "Cadre / Ingénieur", "Cadre supérieur", ""]).optional(),
    type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage", ""]).optional(),
    date_embauche: z.string().min(1, "Date d'embauche obligatoire"),
    date_fin_contrat: z.string().optional(),
    salaire_brut: z.string().optional(),
    sursalaire: z.string().optional(),
    prime_exceptionnelle: z.string().optional(),
    prime_salissure: z.string().optional(),
    prime_depassement: z.string().optional(),
    prime_fonction: z.string().optional(),
    prime_transport: z.string().optional(),
    motif_modification: z.string().max(255).optional(),
    statut: z.enum(["actif", "inactif", "suspendu"]),
  })
  .superRefine((data, ctx) => {
    if (
      ["CDD", "Stage", "Apprentissage"].includes(data.type_contrat ?? "") &&
      !data.date_fin_contrat
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Date de fin obligatoire pour CDD, Stage et Apprentissage",
        path: ["date_fin_contrat"],
      });
    }
    if (
      data.date_fin_contrat &&
      data.date_embauche &&
      data.date_fin_contrat <= data.date_embauche
    ) {
      ctx.addIssue({
        code: "custom",
        message: "La date de fin doit être après la date d'embauche",
        path: ["date_fin_contrat"],
      });
    }
  });

type FormData = z.infer<typeof schema>;

type EmployeeWithPrimes = Employee & {
  civilite?: string | null;
  nationalite?: string | null;
  etat_civil?: string | null;
  nb_enfants?: number | null;
  niveau_etude?: string | null;
  categorie?: string | null;
  sursalaire?: number | null;
  prime_exceptionnelle?: number | null;
  prime_salissure?: number | null;
  prime_depassement?: number | null;
  prime_fonction?: number | null;
  prime_transport?: number | null;
  date_fin_contrat?: string | null;
};

function toFormDefaults(emp: EmployeeWithPrimes): FormData {
  return {
    civilite: (emp.civilite as FormData["civilite"]) ?? "",
    full_name: emp.full_name,
    matricule: emp.matricule,
    genre: (emp.genre as "M" | "F" | "") ?? "",
    date_naissance: emp.date_naissance ?? "",
    nationalite: emp.nationalite ?? "",
    etat_civil: (emp.etat_civil as FormData["etat_civil"]) ?? "",
    nb_enfants: emp.nb_enfants != null ? String(emp.nb_enfants) : "0",
    email: emp.email ?? "",
    phone: emp.phone ?? "",
    poste: emp.poste,
    departement: emp.departement ?? "",
    niveau_etude: (emp.niveau_etude as FormData["niveau_etude"]) ?? "",
    categorie: (emp.categorie as FormData["categorie"]) ?? "",
    type_contrat: (emp.type_contrat as FormData["type_contrat"]) ?? "",
    date_embauche: emp.date_embauche,
    date_fin_contrat: emp.date_fin_contrat ?? "",
    salaire_brut: emp.salaire_brut != null ? String(emp.salaire_brut) : "",
    sursalaire: String(emp.sursalaire ?? 0),
    prime_exceptionnelle: String(emp.prime_exceptionnelle ?? 0),
    prime_salissure: String(emp.prime_salissure ?? 0),
    prime_depassement: String(emp.prime_depassement ?? 0),
    prime_fonction: String(emp.prime_fonction ?? 0),
    prime_transport: String(emp.prime_transport ?? 0),
    motif_modification: "",
    statut: (emp.statut as "actif" | "inactif" | "suspendu") ?? "actif",
  };
}

function cleanPayload(data: FormData): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => {
      if (v === "" || v === undefined) return [k, null];
      if (k === "salaire_brut") return [k, v ? Number(v) : null];
      if (k === "nb_enfants") return [k, v ? Number(v) : 0];
      if (["sursalaire","prime_exceptionnelle","prime_salissure","prime_depassement","prime_fonction","prime_transport"].includes(k))
        return [k, Number(v) || 0];
      return [k, v];
    })
  );
}

interface Props {
  employee?: EmployeeWithPrimes;
}

export function EmployeeDialog({ employee }: Props) {
  const [open, setOpen] = useState(false);
  const [suggestedMatricule, setSuggestedMatricule] = useState<string>("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: employee
      ? toFormDefaults(employee)
      : {
          statut: "actif",
          civilite: "",
          genre: "",
          type_contrat: "",
          etat_civil: "",
          niveau_etude: "",
          categorie: "",
          nb_enfants: "0",
        },
  });

  const typeContrat = watch("type_contrat");
  const needsDateFin = ["CDD", "Stage", "Apprentissage"].includes(typeContrat ?? "");

  // Charger un matricule suggéré pour les nouveaux employés
  useEffect(() => {
    if (employee || !open) return;
    fetch("/api/employees/next-matricule")
      .then((r) => r.json())
      .then((d: { matricule?: string }) => {
        if (d.matricule) {
          setSuggestedMatricule(d.matricule);
          setValue("matricule", d.matricule);
        }
      })
      .catch(() => {});
  }, [open, employee, setValue]);

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
          <DialogTitle>{employee ? "Modifier l'employé" : "Nouvel employé"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">

          {/* ── IDENTITÉ ─────────────────────────────────────────── */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">
              Identité
            </p>

            {/* Civilité + Nom */}
            <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <div>
                <label className="text-sm font-medium">Civilité</label>
                <select {...register("civilite")} className={`mt-1 ${selectClass}`}>
                  <option value="">—</option>
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                  <option value="Mlle">Mlle</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Nom complet *</label>
                <Input
                  {...register("full_name")}
                  placeholder="KOUASSI Jean-Marc"
                  className="mt-1"
                />
                {errors.full_name && (
                  <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
                )}
              </div>
            </div>

            {/* Matricule */}
            <div>
              <label className="text-sm font-medium">
                Matricule
                {!employee && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (auto-généré si vide)
                  </span>
                )}
              </label>
              <div className="mt-1 flex gap-2">
                <Input
                  {...register("matricule")}
                  placeholder={suggestedMatricule || "CI-2026-001"}
                  className="flex-1"
                />
                {!employee && suggestedMatricule && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue("matricule", suggestedMatricule)}
                    title="Utiliser le matricule suggéré"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Genre + Date naissance */}
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

            {/* Nationalité + État civil */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Nationalité</label>
                <Input
                  {...register("nationalite")}
                  placeholder="Ivoirien(ne)"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">État civil</label>
                <select {...register("etat_civil")} className={`mt-1 ${selectClass}`}>
                  <option value="">— Choisir —</option>
                  <option value="Célibataire">Célibataire</option>
                  <option value="Marié(e)">Marié(e)</option>
                  <option value="Divorcé(e)">Divorcé(e)</option>
                  <option value="Veuf/Veuve">Veuf / Veuve</option>
                  <option value="Pacsé(e)">Pacsé(e)</option>
                </select>
              </div>
            </div>

            {/* Nb enfants + Contact */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Enfants à charge</label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  {...register("nb_enfants")}
                  className="mt-1"
                />
              </div>
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
                  placeholder="+225 07 00 00 00"
                  className="mt-1"
                />
              </div>
            </div>
          </section>

          {/* ── POSTE & CONTRAT ──────────────────────────────────── */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">
              Poste & Contrat
            </p>

            {/* Poste + Département */}
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

            {/* Catégorie + Niveau étude */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Catégorie professionnelle</label>
                <select {...register("categorie")} className={`mt-1 ${selectClass}`}>
                  <option value="">— Choisir —</option>
                  <option value="Ouvrier / Employé">Ouvrier / Employé</option>
                  <option value="Agent de maîtrise / Technicien">Agent de maîtrise / Technicien</option>
                  <option value="Cadre / Ingénieur">Cadre / Ingénieur</option>
                  <option value="Cadre supérieur">Cadre supérieur</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Niveau d'études</label>
                <select {...register("niveau_etude")} className={`mt-1 ${selectClass}`}>
                  <option value="">— Choisir —</option>
                  <option value="Primaire">Primaire</option>
                  <option value="Secondaire/Collège">Secondaire / Collège</option>
                  <option value="BAC">BAC</option>
                  <option value="BTS / DUT">BTS / DUT</option>
                  <option value="Licence">Licence</option>
                  <option value="Master">Master</option>
                  <option value="Doctorat">Doctorat</option>
                </select>
              </div>
            </div>

            {/* Type contrat + Date embauche */}
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

            {/* Date de fin — visible uniquement si non-CDI */}
            {needsDateFin && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">
                    Date de fin du contrat *
                  </label>
                  <Input
                    type="date"
                    {...register("date_fin_contrat")}
                    className="mt-1"
                  />
                  {errors.date_fin_contrat && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.date_fin_contrat.message}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Crée automatiquement dans la liste des contrats
                  </p>
                </div>
              </div>
            )}

            {/* Salaire catégoriel + Statut */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">
                  <span className="font-mono text-muted-foreground text-xs mr-1">01</span>
                  Salaire catégoriel (FCFA)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  {...register("salaire_brut")}
                  placeholder="150 000"
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

          {/* ── PRIMES & INDEMNITÉS ──────────────────────────────── */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">
              Primes & Indemnités habituelles
              <span className="ml-2 font-normal normal-case text-muted-foreground/70">
                (reprises automatiquement à chaque bulletin)
              </span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">02</span> Sursalaire (FCFA)
                </label>
                <Input type="number" min="0" step="1000" {...register("sursalaire")} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">03</span> Prime d&apos;ancienneté
                  <span className="ml-1 text-[10px] text-blue-500 font-normal">(auto — 1%/an)</span>
                </label>
                <Input disabled value="Calculée automatiquement" className="mt-1 bg-muted text-muted-foreground text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">04</span> Prime exceptionnelle / 13e mois
                </label>
                <Input type="number" min="0" step="1000" {...register("prime_exceptionnelle")} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">05</span> Prime de salissure
                </label>
                <Input type="number" min="0" step="1000" {...register("prime_salissure")} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">06</span> Prime de dépassement
                </label>
                <Input type="number" min="0" step="1000" {...register("prime_depassement")} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">07</span> Prime liée à la fonction
                </label>
                <Input type="number" min="0" step="1000" {...register("prime_fonction")} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">08</span> Indemnité de transport
                  <span className="ml-1 text-[10px] text-emerald-600 font-normal">(non imposable)</span>
                </label>
                <Input type="number" min="0" step="1000" {...register("prime_transport")} className="mt-1" />
              </div>
            </div>
          </section>

          {/* ── MOTIF MODIFICATION (édition uniquement) ──────────── */}
          {employee && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">
                Motif de modification
              </p>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Raison de la modification salariale
                  <span className="ml-1 font-normal text-muted-foreground text-xs">(optionnel — ex. Augmentation annuelle 2026)</span>
                </label>
                <Input
                  {...register("motif_modification")}
                  placeholder="Augmentation annuelle, avenant au contrat…"
                  className="mt-1"
                />
              </div>
            </section>
          )}

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
