"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  FileText, 
  User, 
  Calendar, 
  CurrencyDollar, 
  Briefcase, 
  ShieldCheck, 
  WarningCircle, 
  Plus, 
  PencilSimple,
  CheckCircle,
  X
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

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
    lieu_travail: z.string().max(150).optional(),
    duree_hebdo: z.string().optional(),
    description_poste: z.string().optional(),
    convention_collective: z.string().max(100).optional(),
    clause_non_concurrence: z.boolean().optional(),
    clause_confidentialite: z.boolean().optional(),
    avantages_nature: z.string().optional(),
    motif_cdd: z.string().optional(),
    signataire_nom: z.string().max(100).optional(),
    date_signature: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (["CDD", "Stage", "Apprentissage"].includes(data.type_contrat) && !data.date_fin) {
      ctx.addIssue({
        code: "custom",
        message: "Date de fin obligatoire pour CDD, Stage et Apprentissage",
        path: ["date_fin"],
      });
    }
    if (data.date_fin && data.date_debut && data.date_fin <= data.date_debut) {
      ctx.addIssue({
        code: "custom",
        message: "La date de fin doit être postérieure à la date de début",
        path: ["date_fin"],
      });
    }
    if (data.type_contrat === "CDD" && !data.motif_cdd) {
      ctx.addIssue({
        code: "custom",
        message: "Le motif du CDD est obligatoire (Art. 14 CT-CI)",
        path: ["motif_cdd"],
      });
    }
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
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8200] focus-visible:border-[#FF8200] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-slate-300 h-11";

const labelClass = "text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
      <X weight="bold" size={12} /> {message}
    </p>
  );
}

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
  lieu_travail?: string | null;
  duree_hebdo?: number | null;
  description_poste?: string | null;
  convention_collective?: string | null;
  clause_non_concurrence?: boolean | null;
  clause_confidentialite?: boolean | null;
  avantages_nature?: string | null;
  motif_cdd?: string | null;
  signataire_nom?: string | null;
  date_signature?: string | null;
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
          lieu_travail: contract.lieu_travail ?? "",
          duree_hebdo: String(contract.duree_hebdo ?? 40),
          description_poste: contract.description_poste ?? "",
          convention_collective: contract.convention_collective ?? "",
          clause_non_concurrence: contract.clause_non_concurrence ?? false,
          clause_confidentialite: contract.clause_confidentialite ?? false,
          avantages_nature: contract.avantages_nature ?? "",
          motif_cdd: contract.motif_cdd ?? "",
          signataire_nom: contract.signataire_nom ?? "",
          date_signature: contract.date_signature ?? "",
        }
      : {
          employee_id: defaultEmployeeId ?? "",
          categorie: "Ouvrier / Employé",
          type_contrat: "CDI",
          renouvellement_count: "0",
          duree_hebdo: "40",
          clause_non_concurrence: false,
          clause_confidentialite: false,
        },
  });

  const typeContrat = watch("type_contrat");
  const dateDebut = watch("date_debut");
  const categorie = watch("categorie");
  const needsDateFin = ["CDD", "Stage", "Apprentissage"].includes(typeContrat);
  const needsMotifCdd = typeContrat === "CDD";

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
      lieu_travail: data.lieu_travail || null,
      duree_hebdo: Number(data.duree_hebdo) || 40,
      description_poste: data.description_poste || null,
      convention_collective: data.convention_collective || null,
      clause_non_concurrence: data.clause_non_concurrence ?? false,
      clause_confidentialite: data.clause_confidentialite ?? false,
      avantages_nature: data.avantages_nature || null,
      motif_cdd: data.motif_cdd || null,
      signataire_nom: data.signataire_nom || null,
      date_signature: data.date_signature || null,
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

    toast.success(isEdit ? "Contrat modifié avec succès" : "Contrat créé avec succès", {
      icon: <CheckCircle weight="fill" className="text-emerald-500 w-5 h-5" />,
      className: "rounded-2xl border-none shadow-2xl bg-white",
    });
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-slate-100 text-slate-600">
            <PencilSimple className="h-4 w-4 text-[#FF8200]" />
          </Button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center rounded-2xl bg-[#FF8200] hover:bg-[#E06D00] text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-[#FF8200]/20 transition-all duration-200 gap-2"
          >
            <Plus weight="bold" className="h-4 w-4" />
            <span>Nouveau contrat</span>
          </motion.button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl overflow-hidden rounded-[2rem] border-none p-0 !bg-transparent shadow-none">
        <div className="bg-white border border-slate-200 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh] relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FF8200]" />
          
          <DialogHeader className="p-8 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#FF8200]/10 text-[#FF8200]">
                <FileText size={28} weight="duotone" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                  {isEdit ? "Modifier le contrat" : "Nouveau contrat"}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Code du Travail CI — Décret n°96-195
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-8 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
            {/* ── PARTIES ─────────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8200]" />
                Parties au contrat
              </div>

              {!isEdit && (
                <div>
                  <label className={labelClass}>
                    <User weight="duotone" />
                    Employé *
                  </label>
                  <select {...register("employee_id")} className={selectClass}>
                    <option value="">— Sélectionner un employé —</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.full_name}</option>
                    ))}
                  </select>
                  <FieldError message={errors.employee_id?.message} />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    <User weight="duotone" />
                    Signataire (employeur)
                  </label>
                  <Input 
                    {...register("signataire_nom")} 
                    placeholder="NOM Prénom — DG / DRH" 
                    className="rounded-xl h-11 focus-visible:ring-[#FF8200]" 
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <Calendar weight="duotone" />
                    Date de signature
                  </label>
                  <Input 
                    type="date" 
                    {...register("date_signature")} 
                    className="rounded-xl h-11 focus-visible:ring-[#FF8200]" 
                  />
                </div>
              </div>
            </div>

            {/* ── NATURE DU CONTRAT ─────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8200]" />
                Nature &amp; Type du contrat
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    <Briefcase weight="duotone" />
                    Catégorie professionnelle *
                  </label>
                  <select {...register("categorie")} className={selectClass}>
                    <option value="Ouvrier / Employé">Ouvrier / Employé — essai max 1 mois</option>
                    <option value="Agent de maîtrise / Technicien">Agent de maîtrise / Technicien — essai max 2 mois</option>
                    <option value="Cadre / Ingénieur">Cadre / Ingénieur — essai max 3 mois</option>
                    <option value="Cadre supérieur">Cadre supérieur — essai max 6 mois</option>
                  </select>
                  <p className="mt-1 text-[10px] text-slate-400">Décret n°96-195 — période d&apos;essai auto-calculée</p>
                </div>
                <div>
                  <label className={labelClass}>
                    <FileText weight="duotone" />
                    Type de contrat *
                  </label>
                  <select {...register("type_contrat")} className={selectClass}>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Apprentissage">Apprentissage</option>
                  </select>
                  <FieldError message={errors.type_contrat?.message} />
                </div>
              </div>

              {typeContrat === "CDD" && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800">
                  <WarningCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <span className="leading-relaxed">CDD : max 24 mois renouvellements inclus · max 2 renouvellements. Au-delà → conversion CDI automatique (Art. 15 CT-CI 2025).</span>
                </div>
              )}

              {needsMotifCdd && (
                <div>
                  <label className={labelClass}>
                    <WarningCircle weight="duotone" />
                    Motif du CDD *{" "}
                    <span className="text-[10px] font-normal text-slate-400">(Art. 14 CT-CI — obligatoire)</span>
                  </label>
                  <Textarea
                    {...register("motif_cdd")}
                    placeholder="Ex : Remplacement de M. KONE absent pour maladie / Surcroît temporaire d'activité…"
                    className="rounded-xl bg-white border-slate-200 min-h-[75px] focus-visible:ring-[#FF8200]"
                  />
                  <FieldError message={errors.motif_cdd?.message} />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    <Briefcase weight="duotone" />
                    Convention collective
                  </label>
                  <Input 
                    {...register("convention_collective")} 
                    placeholder="Interprofessionnelle / BTP / Commerce…" 
                    className="rounded-xl h-11 focus-visible:ring-[#FF8200]" 
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <Briefcase weight="duotone" />
                    Durée hebdomadaire (h)
                  </label>
                  <Input 
                    type="number" min="1" max="60" step="0.5" 
                    {...register("duree_hebdo")} 
                    className="rounded-xl h-11 focus-visible:ring-[#FF8200]" 
                  />
                  <p className="mt-1 text-[10px] text-slate-400">Légal CI : 40h/semaine (Décret n°96-204)</p>
                </div>
              </div>
            </div>

            {/* ── POSTE & LIEU ──────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8200]" />
                Poste &amp; Lieu d&apos;exécution
              </div>

              <div>
                <label className={labelClass}>
                  <Briefcase weight="duotone" />
                  Lieu de travail
                </label>
                <Input 
                  {...register("lieu_travail")} 
                  placeholder="Siège social — Abidjan Plateau / Antenne Bouaké…" 
                  className="rounded-xl h-11 focus-visible:ring-[#FF8200]" 
                />
              </div>

              <div>
                <label className={labelClass}>
                  <FileText weight="duotone" />
                  Description du poste / Missions principales
                </label>
                <Textarea
                  {...register("description_poste")}
                  placeholder="Résumé des responsabilités et missions confiées…"
                  className="rounded-xl bg-white border-slate-200 min-h-[85px] focus-visible:ring-[#FF8200]"
                />
              </div>
            </div>

            {/* ── DURÉE ────────────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8200]" />
                Durée &amp; Rémunération
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    <Calendar weight="duotone" />
                    Date de début *
                  </label>
                  <Input 
                    type="date" 
                    {...register("date_debut")} 
                    className="rounded-xl h-11 focus-visible:ring-[#FF8200]" 
                  />
                  <FieldError message={errors.date_debut?.message} />
                </div>
                <div>
                  <label className={labelClass}>
                    <Calendar weight="duotone" />
                    Date de fin {needsDateFin ? "*" : ""}
                  </label>
                  <Input
                    type="date"
                    {...register("date_fin")}
                    className="rounded-xl h-11 focus-visible:ring-[#FF8200]"
                    disabled={typeContrat === "CDI"}
                    min={dateDebut || undefined}
                  />
                  <FieldError message={errors.date_fin?.message} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    <Calendar weight="duotone" />
                    Fin période d&apos;essai
                  </label>
                  <Input 
                    type="date" 
                    {...register("date_fin_essai")} 
                    className="rounded-xl h-11 focus-visible:ring-[#FF8200]" 
                    min={dateDebut || undefined} 
                  />
                  <FieldError message={errors.date_fin_essai?.message} />
                  <p className="mt-1 text-[10px] text-slate-400">Auto-calculée · modifiable manuellement</p>
                </div>
                <div>
                  <label className={labelClass}>
                    <CurrencyDollar weight="duotone" />
                    Salaire brut (FCFA) *
                  </label>
                  <Input
                    type="number" min="0" step="1000"
                    {...register("salaire_brut")}
                    placeholder="150000"
                    className="rounded-xl h-11 focus-visible:ring-[#FF8200]"
                  />
                  <FieldError message={errors.salaire_brut?.message} />
                </div>
              </div>

              {typeContrat === "CDD" && (
                <div>
                  <label className={labelClass}>
                    <FileText weight="duotone" />
                    Numéro de renouvellement
                  </label>
                  <select {...register("renouvellement_count")} className={selectClass}>
                    <option value="0">Contrat initial</option>
                    <option value="1">1er renouvellement</option>
                    <option value="2">2e renouvellement (dernier autorisé)</option>
                  </select>
                </div>
              )}
            </div>

            {/* ── AVANTAGES & CLAUSES ───────────────── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8200]" />
                Avantages &amp; Clauses Particulières
              </div>

              <div>
                <label className={labelClass}>
                  <ShieldCheck weight="duotone" />
                  Avantages en nature
                </label>
                <Textarea
                  {...register("avantages_nature")}
                  placeholder="Véhicule de fonction · Logement de fonction · Tickets repas · Téléphone…"
                  className="rounded-xl bg-white border-slate-200 min-h-[65px] focus-visible:ring-[#FF8200]"
                />
              </div>

              <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register("clause_non_concurrence")}
                    className="h-4 w-4 rounded-md border-slate-300 accent-[#FF8200]"
                  />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    Clause de non-concurrence
                    <span className="ml-1.5 text-[10px] text-slate-400 font-normal block sm:inline">(durée et périmètre à préciser dans le contrat)</span>
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register("clause_confidentialite")}
                    className="h-4 w-4 rounded-md border-slate-300 accent-[#FF8200]"
                  />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Clause de confidentialité / NDA</span>
                </label>
              </div>
            </div>

            <DialogFooter className="pt-4 sticky bottom-0 bg-white -mx-8 px-8 mt-4 border-t border-slate-100 shrink-0">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-[#FF8200] hover:bg-[#E06D00] text-white font-bold shadow-lg shadow-[#FF8200]/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting
                  ? isEdit ? "Modification..." : "Enregistrement..."
                  : isEdit ? "Enregistrer les modifications" : "Créer le contrat"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
