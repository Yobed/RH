"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { calculerPrimeAnciennete, calculerProvision13e, calculerBulletinComplet, calculerRetenuAbsence } from "@/lib/paie-ci";
import { exportPDF, generatePaySlipPDF, type CompanyInfo } from "@/lib/pdf-templates";

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
import { Pencil, Printer, Download } from "lucide-react";
import type { Tables } from "@/types/supabase";

type Employee = Pick<Tables<"employees">, "id" | "full_name" | "matricule" | "salaire_brut"> & {
  date_embauche: string;
  sursalaire?: number | null;
  prime_exceptionnelle?: number | null;
  prime_salissure?: number | null;
  prime_depassement?: number | null;
  prime_fonction?: number | null;
  prime_transport?: number | null;
};

export interface BulletinEditable {
  id: string;
  periode: string;
  salaire_brut: number;
  sursalaire?: number | null;
  prime_anciennete?: number | null;
  prime_exceptionnelle?: number | null;
  prime_salissure?: number | null;
  prime_depassement?: number | null;
  prime_fonction?: number | null;
  prime_transport?: number | null;
  vacation_allowance?: number | null;
  prime_logement?: number | null;
  prime_responsabilite?: number | null;
  remboursement_frais?: number | null;
  heures_normales?: number | null;
  heures_sup_h15?: number | null;
  heures_sup_h50?: number | null;
  heures_sup_h75?: number | null;
  autres_retenues?: number | null;
  avances?: number | null;
  nb_jours_absence?: number | null;
  employee_id: string;
  employee_name: string;
}

const schema = z.object({
  employee_id: z.string().uuid("Sélectionnez un employé"),
  periode: z.string().regex(/^\d{4}-\d{2}$/, "Format YYYY-MM"),
  salaire_brut:          z.string().min(1, "Salaire catégoriel requis"),
  sursalaire:            z.string().optional(),
  prime_anciennete:      z.string().optional(),
  prime_exceptionnelle:  z.string().optional(),
  prime_salissure:       z.string().optional(),
  prime_depassement:     z.string().optional(),
  prime_fonction:        z.string().optional(),
  prime_transport:       z.string().optional(),
  vacation_allowance:    z.string().optional(),
  prime_logement:        z.string().optional(),
  prime_responsabilite:  z.string().optional(),
  remboursement_frais:   z.string().optional(),
  heures_normales:       z.string().optional(),
  heures_sup_h15:        z.string().optional(),
  heures_sup_h50:        z.string().optional(),
  heures_sup_h75:        z.string().optional(),
  autres_retenues:       z.string().optional(),
  avances:               z.string().optional(),
  nb_jours_absence:      z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

function currentPeriode() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface Props {
  employees: Employee[];
  bulletin?: BulletinEditable; // mode édition si fourni
  company?: CompanyInfo | null;
}



export function PaieDialog({ employees, bulletin, company }: Props) {
  const isEdit = !!bulletin;
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: isEdit ? {
        employee_id:         bulletin.employee_id,
        periode:             bulletin.periode,
        salaire_brut:        String(bulletin.salaire_brut),
        sursalaire:          String(bulletin.sursalaire ?? 0),
        prime_anciennete:    String(bulletin.prime_anciennete ?? 0),
        prime_exceptionnelle: String(bulletin.prime_exceptionnelle ?? 0),
        prime_salissure:     String(bulletin.prime_salissure ?? 0),
        prime_depassement:   String(bulletin.prime_depassement ?? 0),
        prime_fonction:      String(bulletin.prime_fonction ?? 0),
        prime_transport:     String(bulletin.prime_transport ?? 0),
        vacation_allowance:  String(bulletin.vacation_allowance ?? 0),
        prime_logement:      String(bulletin.prime_logement ?? 0),
        prime_responsabilite: String(bulletin.prime_responsabilite ?? 0),
        remboursement_frais: String(bulletin.remboursement_frais ?? 0),
        heures_normales:     String(bulletin.heures_normales ?? 173.33),
        heures_sup_h15:      String(bulletin.heures_sup_h15 ?? 0),
        heures_sup_h50:      String(bulletin.heures_sup_h50 ?? 0),
        heures_sup_h75:      String(bulletin.heures_sup_h75 ?? 0),
        autres_retenues:     String(bulletin.autres_retenues ?? 0),
        avances:             String(bulletin.avances ?? 0),
        nb_jours_absence:    String(bulletin.nb_jours_absence ?? 0),
      } : {
        periode: currentPeriode(),
        sursalaire: "0", prime_anciennete: "0", prime_exceptionnelle: "0",
        prime_salissure: "0", prime_depassement: "0", prime_fonction: "0",
        prime_transport: "0", vacation_allowance: "0",
        prime_logement: "0", prime_responsabilite: "0", remboursement_frais: "0",
        heures_normales: "173.33",
        heures_sup_h15: "0", heures_sup_h50: "0", heures_sup_h75: "0",
        autres_retenues: "0", avances: "0", nb_jours_absence: "0",
      },
    });

  const empId = watch("employee_id");
  const brut  = watch("salaire_brut");

  // Auto-remplir salaire + primes selon l'employé sélectionné (création seulement)
  useEffect(() => {
    if (isEdit || !empId) return;
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const brut = Number(emp.salaire_brut ?? 0);
    if (emp.salaire_brut) setValue("salaire_brut", String(emp.salaire_brut));
    setValue("sursalaire",           String(emp.sursalaire ?? 0));
    setValue("prime_exceptionnelle", String(calculerProvision13e(brut)));
    setValue("prime_salissure",      String(emp.prime_salissure ?? 0));
    setValue("prime_depassement",    String(emp.prime_depassement ?? 0));
    setValue("prime_fonction",       String(emp.prime_fonction ?? 0));
    setValue("prime_transport",      String(emp.prime_transport ?? 0));
    if (emp.date_embauche) {
      const pa = calculerPrimeAnciennete(brut, emp.date_embauche);
      setValue("prime_anciennete", String(pa));
    }
  }, [empId, employees, setValue, isEdit]);

  // Recalcul primes auto si le salaire catégoriel change (création seulement)
  useEffect(() => {
    if (isEdit) return;
    const emp = employees.find((e) => e.id === empId);
    const brutNum = Number(brut) || 0;
    setValue("prime_exceptionnelle", String(calculerProvision13e(brutNum)));
    if (emp?.date_embauche) {
      const pa = calculerPrimeAnciennete(brutNum, emp.date_embauche);
      setValue("prime_anciennete", String(pa));
    }
  }, [brut, empId, employees, setValue, isEdit]);

  // Aperçu calculé en temps réel
  const nums = {
    salaire_brut:         Number(watch("salaire_brut")) || 0,
    sursalaire:           Number(watch("sursalaire")) || 0,
    prime_anciennete:     Number(watch("prime_anciennete")) || 0,
    prime_exceptionnelle: Number(watch("prime_exceptionnelle")) || 0,
    prime_salissure:      Number(watch("prime_salissure")) || 0,
    prime_depassement:    Number(watch("prime_depassement")) || 0,
    prime_fonction:       Number(watch("prime_fonction")) || 0,
    prime_transport:      Number(watch("prime_transport")) || 0,
    vacation_allowance:   Number(watch("vacation_allowance")) || 0,
    prime_logement:       Number(watch("prime_logement")) || 0,
    prime_responsabilite: Number(watch("prime_responsabilite")) || 0,
    remboursement_frais:  Number(watch("remboursement_frais")) || 0,
    heures_normales:      Number(watch("heures_normales")) || 173.33,
    heures_sup:           {
      h15: Number(watch("heures_sup_h15")) || 0,
      h50: Number(watch("heures_sup_h50")) || 0,
      h75: Number(watch("heures_sup_h75")) || 0,
    },
    autres_retenues:      Number(watch("autres_retenues")) || 0,
    avances:              Number(watch("avances")) || 0,
    nb_jours_absence:     Number(watch("nb_jours_absence")) || 0,
  };
  const preview = nums.salaire_brut > 0 ? calculerBulletinComplet(nums) : null;

  async function onSubmit(data: FormData) {
    const payload = {
      salaire_brut:         Number(data.salaire_brut),
      sursalaire:           Number(data.sursalaire) || 0,
      prime_anciennete:     Number(data.prime_anciennete) || 0,
      prime_exceptionnelle: Number(data.prime_exceptionnelle) || 0,
      prime_salissure:      Number(data.prime_salissure) || 0,
      prime_depassement:    Number(data.prime_depassement) || 0,
      prime_fonction:       Number(data.prime_fonction) || 0,
      prime_transport:      Number(data.prime_transport) || 0,
      vacation_allowance:   Number(data.vacation_allowance) || 0,
      prime_logement:       Number(data.prime_logement) || 0,
      prime_responsabilite: Number(data.prime_responsabilite) || 0,
      remboursement_frais:  Number(data.remboursement_frais) || 0,
      heures_normales:      Number(data.heures_normales) || 173.33,
      heures_sup_h15:       Number(data.heures_sup_h15) || 0,
      heures_sup_h50:       Number(data.heures_sup_h50) || 0,
      heures_sup_h75:       Number(data.heures_sup_h75) || 0,
      autres_retenues:      Number(data.autres_retenues) || 0,
      avances:              Number(data.avances) || 0,
      nb_jours_absence:     Number(data.nb_jours_absence) || 0,
    };

    const res = isEdit
      ? await fetch(`/api/paie/${bulletin!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/paie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_id: data.employee_id, periode: data.periode, ...payload }),
        });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success(isEdit ? "Bulletin mis à jour" : "Bulletin de paie créé");
    setOpen(false);
    if (!isEdit) reset({
      periode: currentPeriode(),
      sursalaire: "0", prime_anciennete: "0", prime_exceptionnelle: "0",
      prime_salissure: "0", prime_depassement: "0", prime_fonction: "0",
      prime_transport: "0", vacation_allowance: "0",
      prime_logement: "0", prime_responsabilite: "0", remboursement_frais: "0",
      heures_normales: "173.33",
      heures_sup_h15: "0", heures_sup_h50: "0", heures_sup_h75: "0",
      autres_retenues: "0", avances: "0", nb_jours_absence: "0",
    });
    router.refresh();
  }

  const handleDownloadPDF = () => {
    if (!preview) return;
    const emp = employees.find(e => e.id === watch("employee_id"));
    const doc = generatePaySlipPDF({
      result: preview,
      lines: nums,
      employee: emp || { full_name: bulletin?.employee_name || "Employé", matricule: "—", poste: "—" },
      company: company || { name: "RH Manager CI" },
      period: watch("periode")
    });
    exportPDF(doc, `Bulletin_${watch("periode")}_${emp?.full_name || "Salarie"}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          <Pencil className="h-3.5 w-3.5" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nouveau bulletin
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Modifier le bulletin — ${bulletin!.periode}` : "Nouveau bulletin de paie"}
          </DialogTitle>
          {isEdit && (
            <p className="text-sm text-muted-foreground">{bulletin!.employee_name}</p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">

          {/* Employé + Période */}
          {!isEdit && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Employé *</label>
                <select {...register("employee_id")} className={`mt-1 ${selectClass}`}>
                  <option value="">— Sélectionner —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name} ({e.matricule})</option>
                  ))}
                </select>
                {errors.employee_id && <p className="mt-1 text-xs text-red-500">{errors.employee_id.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Période *</label>
                <Input type="month" {...register("periode")} className="mt-1" />
                {errors.periode && <p className="mt-1 text-xs text-red-500">{errors.periode.message}</p>}
              </div>
            </div>
          )}

          {/* ── ÉLÉMENTS DE SALAIRE ─────────────────────────────────── */}
          <div className="rounded-lg border bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
              Éléments de salaire
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* 01 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">01</span> Salaire catégoriel (FCFA) *
                </label>
                <Input type="number" min="0" step="1000" {...register("salaire_brut")} className="mt-1" />
                {errors.salaire_brut && <p className="mt-1 text-xs text-red-500">{errors.salaire_brut.message}</p>}
              </div>

              {/* 02 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">02</span> Sursalaire (FCFA)
                </label>
                <Input type="number" min="0" step="1000" {...register("sursalaire")} className="mt-1" />
              </div>

              {/* 03 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">03</span> Prime d&apos;ancienneté (auto)
                </label>
                <Input type="number" min="0" step="100" {...register("prime_anciennete")} className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Auto = 1% × années service × salaire catégoriel (CCI Art.17)
                </p>
              </div>

              {/* 04 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">04</span> Prime exceptionnelle / 13e mois
                </label>
                <Input type="number" min="0" step="100" {...register("prime_exceptionnelle")} className="mt-1" />
                {!isEdit && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Auto = salaire × 75% / 12 (prorata temporis mensuel)
                  </p>
                )}
              </div>

              {/* 05 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">05</span> Prime de salissure
                </label>
                <Input type="number" min="0" step="1000" {...register("prime_salissure")} className="mt-1" />
              </div>

              {/* 06 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">06</span> Prime de dépassement
                </label>
                <Input type="number" min="0" step="1000" {...register("prime_depassement")} className="mt-1" />
              </div>

              {/* 07 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">07</span> Prime liée à la fonction
                </label>
                <Input type="number" min="0" step="1000" {...register("prime_fonction")} className="mt-1" />
              </div>

              {/* 08 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">08</span> Indemnité de transport
                  <span className="ml-1 text-[10px] text-emerald-600 font-normal">(non imposable)</span>
                </label>
                <Input type="number" min="0" step="1000" {...register("prime_transport")} className="mt-1" />
              </div>

              {/* 09 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">09</span> Indemnité congés payés
                  <span className="ml-1 text-[10px] text-emerald-600 font-normal">(exonérée)</span>
                </label>
                <Input type="number" min="0" step="1000" {...register("vacation_allowance")} className="mt-1" />
              </div>

              {/* 10 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">10</span> Prime de logement
                  <span className="ml-1 text-[10px] text-emerald-600 font-normal">(exonérée CI)</span>
                </label>
                <Input type="number" min="0" step="1000" {...register("prime_logement")} className="mt-1" />
              </div>

              {/* 11 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">11</span> Prime de responsabilité
                  <span className="ml-1 text-[10px] text-slate-400 font-normal">(imposable)</span>
                </label>
                <Input type="number" min="0" step="1000" {...register("prime_responsabilite")} className="mt-1" />
              </div>

              {/* 12 */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  <span className="font-mono text-muted-foreground mr-1">12</span> Remboursement de frais
                  <span className="ml-1 text-[10px] text-emerald-600 font-normal">(exonéré)</span>
                </label>
                <Input type="number" min="0" step="1000" {...register("remboursement_frais")} className="mt-1" />
              </div>

              {/* Heures normales */}
              <div>
                <label className="text-xs font-medium text-slate-700">Heures normales du mois</label>
                <Input type="number" min="0" step="0.01" {...register("heures_normales")} className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Base taux horaire (défaut 173,33h)</p>
              </div>
            </div>
          </div>

          {/* ── HEURES SUPPLÉMENTAIRES ───────────────────────────────── */}
          <div className="rounded-lg border bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
              Heures Supplémentaires
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-slate-700">HS 15% (Jours ouvrables)</label>
                <Input type="number" min="0" step="1" {...register("heures_sup_h15")} className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">De 41h à 48h</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">HS 50% (Au-delà / Nuit)</label>
                <Input type="number" min="0" step="1" {...register("heures_sup_h50")} className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">&gt; 48h ou Nuit</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">HS 75% (Dimanche / Férié)</label>
                <Input type="number" min="0" step="1" {...register("heures_sup_h75")} className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Jours de repos/fériés</p>
              </div>
            </div>
          </div>

          {/* ── RETENUES DIVERSES ────────────────────────────────────── */}
          <div className="rounded-lg border bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
              Retenues
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Autres retenues (FCFA)</label>
                <Input type="number" min="0" step="1000" {...register("autres_retenues")} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Avances / Acomptes (FCFA)</label>
                <Input type="number" min="0" step="1000" {...register("avances")} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Jours d&apos;absence non justifiée
                </label>
                <Input type="number" min="0" max="31" step="1" placeholder="0" {...register("nb_jours_absence")} className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Retenue = brut ÷ 26 × jours</p>
              </div>
            </div>
          </div>

          {/* ── APERÇU SAGE ──────────────────────────────────────────── */}
          {preview && (
            <div className="rounded-lg border bg-slate-50 p-4 space-y-1 text-sm">
              <div className="flex justify-between items-center mb-3">
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Aperçu bulletin — nomenclature Sage
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  className="h-7 text-[10px] gap-1.5"
                >
                  <Printer className="h-3 w-3" />
                  PDF
                </Button>
              </div>

              {/* GAINS */}
              <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest mb-1">Gains</p>
              <div className="flex justify-between text-slate-600">
                <span>Salaire de base</span>
                <span>{fmt(nums.salaire_brut)}</span>
              </div>
              {(nums.sursalaire ?? 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Sursalaire</span>
                  <span>{fmt(nums.sursalaire)}</span>
                </div>
              )}
              {(nums.prime_anciennete ?? 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Prime d&apos;ancienneté</span>
                  <span>{fmt(nums.prime_anciennete)}</span>
                </div>
              )}
              {nums.prime_responsabilite > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Prime de responsabilité</span>
                  <span>{fmt(nums.prime_responsabilite)}</span>
                </div>
              )}
              {(nums.vacation_allowance ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Indemnité congés payés <span className="text-[10px]">(exon.)</span></span>
                  <span>{fmt(nums.vacation_allowance)}</span>
                </div>
              )}
              {nums.prime_transport > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Indemnité de transport <span className="text-[10px]">(exon.)</span></span>
                  <span>{fmt(nums.prime_transport)}</span>
                </div>
              )}
              {nums.prime_logement > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Prime de logement <span className="text-[10px]">(exon.)</span></span>
                  <span>{fmt(nums.prime_logement)}</span>
                </div>
              )}
              {nums.remboursement_frais > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Remboursement de frais <span className="text-[10px]">(exon.)</span></span>
                  <span>{fmt(nums.remboursement_frais)}</span>
                </div>
              )}
              {/* Taux horaire — info */}
              <div className="flex justify-between text-[10px] text-slate-400 italic pt-1">
                <span>Taux horaire ({nums.heures_normales}h)</span>
                <span>{fmt(Math.round((nums.salaire_brut + nums.sursalaire) / nums.heures_normales))}/h</span>
              </div>
              {preview.overtime_pay > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Heures supplémentaires</span>
                  <span>{fmt(preview.overtime_pay)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                <span>*** SALAIRE BRUT ***</span>
                <span>{fmt(preview.gross_salary)}</span>
              </div>
              {preview.exempt_indemnity > 0 && (
                <div className="flex justify-between text-emerald-700 text-xs">
                  <span>*** INDEMNITE EXONEREE ***</span>
                  <span>{fmt(preview.exempt_indemnity)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-500">
                <span>*** BRUT FISCAL ***</span>
                <span>{fmt(preview.fiscal_gross)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>*** BRUT SOCIAL ***</span>
                <span>{fmt(preview.social_gross)}</span>
              </div>

              {/* RETENUES */}
              <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest mt-3 mb-1">Retenues salariales</p>
              <div className="flex justify-between text-red-600">
                <span>Retenue CNPS (6,3% + CMU)</span>
                <span>{fmt(preview.withholding_cnps)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Contribution nationale CN (1,5%)</span>
                <span>{fmt(preview.tax_cn)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>IGR — barème progressif</span>
                <span>{fmt(preview.tax_igr)}</span>
              </div>
              {nums.autres_retenues > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Autres retenues</span>
                  <span>{fmt(nums.autres_retenues)}</span>
                </div>
              )}
              {nums.avances > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Avances / Acomptes</span>
                  <span>{fmt(nums.avances)}</span>
                </div>
              )}
              {nums.nb_jours_absence > 0 && (preview.retenu_absence ?? 0) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Retenue absence ({nums.nb_jours_absence}j)</span>
                  <span>{fmt(preview.retenu_absence)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-500 border-t pt-1 mt-1">
                <span>*** TOTAL DES COTISATIONS ***</span>
                <span>{fmt(preview.total_contributions)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>*** NET AVANT RETENUE ***</span>
                <span>{fmt(preview.net_before_withholding)}</span>
              </div>

              {/* NET À PAYER */}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-emerald-700 text-base">
                <span>NET A PAYER</span>
                <span>{fmt(preview.net_to_pay)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (isEdit ? "Enregistrement..." : "Création...") : (isEdit ? "Enregistrer" : "Créer le bulletin")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
