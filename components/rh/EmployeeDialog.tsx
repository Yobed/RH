"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PencilSimple, Plus, ArrowsClockwise } from "@phosphor-icons/react";

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
import { EmployeePhotoUpload } from "./EmployeePhotoUpload";

type Employee = Tables<"employees">;

interface SalaryGridRow {
  id: string;
  libelle: string;
  code: string;
  famille: "TEC" | "CHA" | "EMP" | "CAD" | "OUV";
  type_remu: string;
  salaire_base: number;
  ordre: number;
}

const FAMILLE_LABELS: Record<SalaryGridRow["famille"], string> = {
  TEC: "Agents techniques",
  CHA: "Chauffeurs",
  EMP: "Employés",
  CAD: "Cadres / Ingénieurs",
  OUV: "Ouvriers",
};

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] disabled:cursor-not-allowed disabled:opacity-50";

const schema = z
  .object({
    // ── Identité ─────────────────────────────────────────────
    civilite: z.enum(["M.", "Mme", "Mlle", ""]).optional(),
    full_name: z.string().min(2, "Minimum 2 caractères").max(100),
    matricule: z.string().max(20).optional(),
    genre: z.enum(["M", "F", ""]).optional(),
    date_naissance: z.string().optional(),
    lieu_naissance: z.string().max(100).optional(),
    nationalite: z.string().max(100).optional(),
    etat_civil: z.enum(["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf/Veuve", "Pacsé(e)", ""]).optional(),
    nb_enfants: z.string().optional(),
    nb_personnes_charge: z.string().optional(),
    groupe_sanguin: z.string().max(5).optional(),
    consent_donnees_personnelles: z.boolean().optional(),
    // ── Pièce d'identité ─────────────────────────────────────
    num_cni: z.string().max(30).optional(),
    date_expiration_cni: z.string().optional(),
    num_cnps: z.string().max(30).optional(),
    // ── Contact ──────────────────────────────────────────────
    email: z
      .string()
      .optional()
      .refine(
        (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Email invalide" }
      ),
    phone: z.string().max(20).optional(),
    adresse: z.string().max(255).optional(),
    situation_logement: z.enum(["Locataire", "Propriétaire", "Hébergé(e)", ""]).optional(),
    rib: z.string().max(50).optional(),
    mobile_money: z.string().max(30).optional(),
    contact_urgence_nom: z.string().max(100).optional(),
    contact_urgence_tel: z.string().max(20).optional(),
    // ── Poste & Contrat ───────────────────────────────────────
    poste: z.string().min(2, "Poste obligatoire").max(100),
    departement: z.string().max(100).optional(),
    site_travail: z.string().max(100).optional(),
    niveau_etude: z.enum(["Primaire", "Secondaire/Collège", "BAC", "BTS / DUT", "Licence", "Master", "Doctorat", ""]).optional(),
    categorie: z.string().max(60).optional(),
    photo_url: z.string().url().optional().or(z.literal("")),
    convention_collective: z.string().max(100).optional(),
    type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage", ""]).optional(),
    date_embauche: z.string().min(1, "Date d'embauche obligatoire"),
    date_fin_contrat: z.string().optional(),
    anciennete_anterieure: z.string().optional(),
    // ── Rémunération ─────────────────────────────────────────
    salaire_brut: z.string().optional(),
    sursalaire: z.string().optional(),
    prime_exceptionnelle: z.string().optional(),
    prime_salissure: z.string().optional(),
    prime_depassement: z.string().optional(),
    prime_fonction: z.string().optional(),
    prime_transport: z.string().optional(),
    // ── Admin ─────────────────────────────────────────────────
    manager_id: z.string().optional(),
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
  lieu_naissance?: string | null;
  etat_civil?: string | null;
  nb_enfants?: number | null;
  nb_personnes_charge?: number | null;
  groupe_sanguin?: string | null;
  num_cni?: string | null;
  date_expiration_cni?: string | null;
  adresse?: string | null;
  situation_logement?: string | null;
  rib?: string | null;
  mobile_money?: string | null;
  contact_urgence_nom?: string | null;
  contact_urgence_tel?: string | null;
  site_travail?: string | null;
  convention_collective?: string | null;
  anciennete_anterieure?: number | null;
  niveau_etude?: string | null;
  categorie?: string | null;
  photo_url?: string | null;
  sursalaire?: number | null;
  prime_exceptionnelle?: number | null;
  prime_salissure?: number | null;
  prime_depassement?: number | null;
  prime_fonction?: number | null;
  prime_transport?: number | null;
  date_fin_contrat?: string | null;
  num_cnps?: string | null;
  manager_id?: string | null;
};

function toFormDefaults(emp: EmployeeWithPrimes): FormData {
  return {
    civilite: (emp.civilite as FormData["civilite"]) ?? "",
    full_name: emp.full_name,
    matricule: emp.matricule,
    genre: (emp.genre as "M" | "F" | "") ?? "",
    date_naissance: emp.date_naissance ?? "",
    lieu_naissance: emp.lieu_naissance ?? "",
    nationalite: emp.nationalite ?? "",
    etat_civil: (emp.etat_civil as FormData["etat_civil"]) ?? "",
    nb_enfants: emp.nb_enfants != null ? String(emp.nb_enfants) : "0",
    nb_personnes_charge: emp.nb_personnes_charge != null ? String(emp.nb_personnes_charge) : "0",
    groupe_sanguin: emp.groupe_sanguin ?? "",
    num_cni: emp.num_cni ?? "",
    date_expiration_cni: emp.date_expiration_cni ?? "",
    num_cnps: emp.num_cnps ?? "",
    email: emp.email ?? "",
    phone: emp.phone ?? "",
    adresse: emp.adresse ?? "",
    situation_logement: (emp.situation_logement as FormData["situation_logement"]) ?? "",
    rib: emp.rib ?? "",
    mobile_money: emp.mobile_money ?? "",
    contact_urgence_nom: emp.contact_urgence_nom ?? "",
    contact_urgence_tel: emp.contact_urgence_tel ?? "",
    poste: emp.poste,
    departement: emp.departement ?? "",
    site_travail: emp.site_travail ?? "",
    niveau_etude: (emp.niveau_etude as FormData["niveau_etude"]) ?? "",
    categorie: emp.categorie ?? "",
    photo_url: emp.photo_url ?? "",
    convention_collective: emp.convention_collective ?? "",
    type_contrat: (emp.type_contrat as FormData["type_contrat"]) ?? "",
    date_embauche: emp.date_embauche,
    date_fin_contrat: emp.date_fin_contrat ?? "",
    anciennete_anterieure: emp.anciennete_anterieure != null ? String(emp.anciennete_anterieure) : "0",
    salaire_brut: emp.salaire_brut != null ? String(emp.salaire_brut) : "",
    sursalaire: String(emp.sursalaire ?? 0),
    prime_exceptionnelle: String(emp.prime_exceptionnelle ?? 0),
    prime_salissure: String(emp.prime_salissure ?? 0),
    prime_depassement: String(emp.prime_depassement ?? 0),
    prime_fonction: String(emp.prime_fonction ?? 0),
    prime_transport: String(emp.prime_transport ?? 0),
    manager_id: emp.manager_id ?? "",
    motif_modification: "",
    statut: (emp.statut as "actif" | "inactif" | "suspendu") ?? "actif",
  };
}

function cleanPayload(data: FormData): Record<string, unknown> {
  const consentChecked = data.consent_donnees_personnelles === true;
  const payload = Object.fromEntries(
    Object.entries(data)
      .filter(([k]) => k !== "consent_donnees_personnelles") // boolean → traité ci-dessous
      .map(([k, v]) => {
        if (v === "" || v === undefined) return [k, null];
        if (k === "salaire_brut") return [k, v ? Number(v) : null];
        if (k === "nb_enfants") return [k, v ? Number(v) : 0];
        if (k === "nb_personnes_charge") return [k, v ? Number(v) : 0];
        if (k === "anciennete_anterieure") return [k, v ? Number(v) : 0];
        if (["sursalaire","prime_exceptionnelle","prime_salissure","prime_depassement","prime_fonction","prime_transport"].includes(k))
          return [k, Number(v) || 0];
        return [k, v];
      })
  );
  if (consentChecked) {
    payload.consent_donnees_personnelles_at = new Date().toISOString();
  }
  return payload;
}

interface Props {
  employee?: EmployeeWithPrimes;
  employees?: { id: string; full_name: string }[];
  trigger?: React.ReactNode;
}

export function EmployeeDialog({ employee, employees = [], trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [suggestedMatricule, setSuggestedMatricule] = useState<string>("");
  const [salaryGrid, setSalaryGrid] = useState<SalaryGridRow[]>([]);
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
          situation_logement: "",
          nb_enfants: "0",
          nb_personnes_charge: "0",
          anciennete_anterieure: "0",
        },
  });

  const typeContrat = watch("type_contrat");
  const needsDateFin = ["CDD", "Stage", "Apprentissage"].includes(typeContrat ?? "");
  const photoUrl = watch("photo_url");
  const fullName = watch("full_name");
  const categorieValue = watch("categorie");

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

  useEffect(() => {
    if (!open || salaryGrid.length > 0) return;
    fetch("/api/salary-grid")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: SalaryGridRow[]) => setSalaryGrid(Array.isArray(rows) ? rows : []))
      .catch(() => setSalaryGrid([]));
  }, [open, salaryGrid.length]);

  function handleCategorieChange(libelle: string) {
    setValue("categorie", libelle);
    const row = salaryGrid.find((r) => r.libelle === libelle);
    if (row) {
      setValue("salaire_brut", String(row.salaire_base));
    }
  }

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
      {trigger ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
          className="contents"
        >
          {trigger}
        </div>
      ) : (
        <DialogTrigger
          render={
            employee ? (
              <Button variant="ghost" size="sm" aria-label="Modifier" />
            ) : (
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-0" />
            )
          }
        >
          {employee ? (
            <PencilSimple className="h-4 w-4" weight="bold" />
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" weight="bold" />
              Ajouter un collaborateur
            </>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh] bg-white border-slate-200 p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
          <DialogTitle className="text-base font-semibold text-slate-800">{employee ? "Modifier l'employé" : "Nouvel employé"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">

          {/* ── IDENTITÉ ─────────────────────────────────────────── */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
              Identité
            </p>

            <EmployeePhotoUpload
              value={photoUrl || null}
              fullName={fullName}
              onChange={(url) => setValue("photo_url", url ?? "")}
            />

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
                <Input {...register("full_name")} placeholder="KOUASSI Jean-Marc" className="mt-1" />
                {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
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
                <label className="text-sm font-medium">Lieu de naissance</label>
                <Input {...register("lieu_naissance")} placeholder="Abidjan" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Nationalité</label>
                <Input {...register("nationalite")} placeholder="Ivoirien(ne)" className="mt-1" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
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
              <div>
                <label className="text-sm font-medium">Enfants à charge</label>
                <Input type="number" min="0" max="20" {...register("nb_enfants")} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Personnes à charge (total)</label>
                <Input type="number" min="0" max="30" {...register("nb_personnes_charge")} className="mt-1" />
                <p className="mt-0.5 text-[10px] text-muted-foreground">Conjoints + enfants + ascendants</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Groupe sanguin</label>
                <select {...register("groupe_sanguin")} className={`mt-1 ${selectClass}`}>
                  <option value="">—</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Matricule</label>
                <div className="mt-1 flex gap-2">
                  <Input
                    {...register("matricule")}
                    placeholder={suggestedMatricule || "CI-2026-001"}
                    className="flex-1"
                  />
                  {!employee && suggestedMatricule && (
                    <Button
                      type="button" variant="outline" size="sm"
                      onClick={() => setValue("matricule", suggestedMatricule)}
                      title="Utiliser le matricule suggéré"
                    >
                      <ArrowsClockwise className="h-3.5 w-3.5" weight="bold" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── PIÈCE D'IDENTITÉ & CNPS ──────────────────────────── */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
              Pièce d&apos;identité & Sécurité sociale
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium">N° CNI / Passeport</label>
                <Input {...register("num_cni")} placeholder="CI-0000000-A" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Expiration CNI</label>
                <Input type="date" {...register("date_expiration_cni")} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">N° CNPS</label>
                <Input {...register("num_cnps")} placeholder="CI-00-000000" className="mt-1" />
              </div>
            </div>
          </section>

          {/* ── COORDONNÉES ──────────────────────────────────────── */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
              Coordonnées
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" {...register("email")} placeholder="jean@entreprise.ci" className="mt-1" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Téléphone</label>
                <Input {...register("phone")} placeholder="+225 07 00 00 00" className="mt-1" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Adresse domicile</label>
              <Input {...register("adresse")} placeholder="Quartier Deux Plateaux, Cocody, Abidjan" className="mt-1" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Situation logement</label>
                <select {...register("situation_logement")} className={`mt-1 ${selectClass}`}>
                  <option value="">— Choisir —</option>
                  <option value="Locataire">Locataire</option>
                  <option value="Propriétaire">Propriétaire</option>
                  <option value="Hébergé(e)">Hébergé(e)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Mobile Money</label>
                <Input {...register("mobile_money")} placeholder="Orange Money / Wave / MTN" className="mt-1" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">RIB / Coordonnées bancaires</label>
              <Input {...register("rib")} placeholder="CI00 XXXX XXXX XXXX XXXX XXXX XXX" className="mt-1" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Contact urgence — Nom</label>
                <Input {...register("contact_urgence_nom")} placeholder="KONE Aminata (épouse)" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Contact urgence — Tél</label>
                <Input {...register("contact_urgence_tel")} placeholder="+225 05 00 00 00" className="mt-1" />
              </div>
            </div>
          </section>

          {/* ── POSTE & CONTRAT ──────────────────────────────────── */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
              Poste & Contrat
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Intitulé du poste *</label>
                <Input {...register("poste")} placeholder="Comptable" className="mt-1" />
                {errors.poste && <p className="mt-1 text-xs text-red-500">{errors.poste.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Département</label>
                <Input {...register("departement")} placeholder="Finance" className="mt-1" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Site / Lieu de travail</label>
                <Input {...register("site_travail")} placeholder="Siège Abidjan / Bouaké" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Convention collective</label>
                <Input {...register("convention_collective")} placeholder="Interprofessionnelle / BTP / Commerce…" className="mt-1" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">
                  Catégorie professionnelle
                  <span className="ml-1 text-[10px] text-blue-600 font-normal">
                    (auto-remplit le salaire de base)
                  </span>
                </label>
                <select
                  value={categorieValue ?? ""}
                  onChange={(e) => handleCategorieChange(e.target.value)}
                  className={`mt-1 ${selectClass}`}
                >
                  <option value="">— Choisir une catégorie —</option>
                  {(["CAD", "TEC", "EMP", "OUV", "CHA"] as const).map((fam) => {
                    const rows = salaryGrid.filter((r) => r.famille === fam);
                    if (rows.length === 0) return null;
                    return (
                      <optgroup key={fam} label={FAMILLE_LABELS[fam]}>
                        {rows.map((r) => (
                          <option key={r.id} value={r.libelle}>
                            {r.libelle} — {Math.round(r.salaire_base).toLocaleString("fr-FR")} FCFA
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                {salaryGrid.length === 0 && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Chargement de la grille…
                  </p>
                )}
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
                {errors.date_embauche && <p className="mt-1 text-xs text-red-500">{errors.date_embauche.message}</p>}
              </div>
            </div>

            {needsDateFin && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Date de fin du contrat *</label>
                  <Input type="date" {...register("date_fin_contrat")} className="mt-1" />
                  {errors.date_fin_contrat && <p className="mt-1 text-xs text-red-500">{errors.date_fin_contrat.message}</p>}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Ancienneté antérieure (mois)</label>
                <Input type="number" min="0" {...register("anciennete_anterieure")} className="mt-1" />
                <p className="mt-0.5 text-[10px] text-muted-foreground">Si reprise d'ancienneté négociée à l'embauche</p>
              </div>
              {employees.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Responsable hiérarchique</label>
                  <select {...register("manager_id")} className={`mt-1 ${selectClass}`}>
                    <option value="">— Aucun / À définir —</option>
                    {employees
                      .filter((e) => e.id !== employee?.id)
                      .map((e) => (
                        <option key={e.id} value={e.id}>{e.full_name}</option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">
                  <span className="font-mono text-muted-foreground text-xs mr-1">01</span>
                  Salaire catégoriel (FCFA)
                </label>
                <Input type="number" min="0" step="1000" {...register("salaire_brut")} placeholder="150 000" className="mt-1" />
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
              Primes & Indemnités habituelles
              <span className="ml-2 font-normal normal-case text-slate-400/70">
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

          {/* ── CONSENTEMENT DONNÉES PERSONNELLES (création) ────── */}
          {!employee && (
            <section className="space-y-2 rounded-md border border-amber-200 bg-amber-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                Conformité Loi n° 2013-450 (ARTCI)
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("consent_donnees_personnelles")}
                  className="h-4 w-4 mt-0.5 rounded border-slate-300 accent-[#2563eb] text-[#2563eb] focus:ring-[#2563eb]"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  Le salarié consent au traitement de ses données personnelles
                  conformément à la <a href="/legal/confidentialite" target="_blank" className="underline text-slate-900">politique de confidentialité</a>
                  {" "}(Art. 35 Loi 2013-450). À cocher après lecture par le salarié.
                </span>
              </label>
            </section>
          )}

          {/* ── MOTIF MODIFICATION (édition uniquement) ──────────── */}
          {employee && (
            <section className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                Motif de modification
              </p>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Raison de la modification salariale
                  <span className="ml-1 font-normal text-muted-foreground text-xs">(optionnel)</span>
                </label>
                <Input
                  {...register("motif_modification")}
                  placeholder="Augmentation annuelle, avenant au contrat…"
                  className="mt-1"
                />
              </div>
            </section>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-0"
            >
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
