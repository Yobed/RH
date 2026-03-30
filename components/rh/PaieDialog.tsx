"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { calculerPrimeAnciennete, calculerProvision13e, calculerBulletinComplet } from "@/lib/paie-ci";

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
import { Pencil } from "lucide-react";
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
  autres_retenues?: number | null;
  avances?: number | null;
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
  autres_retenues:       z.string().optional(),
  avances:               z.string().optional(),
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
}



export function PaieDialog({ employees, bulletin }: Props) {
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
        autres_retenues:     String(bulletin.autres_retenues ?? 0),
        avances:             String(bulletin.avances ?? 0),
      } : {
        periode: currentPeriode(),
        sursalaire: "0", prime_anciennete: "0", prime_exceptionnelle: "0",
        prime_salissure: "0", prime_depassement: "0", prime_fonction: "0",
        prime_transport: "0", autres_retenues: "0", avances: "0",
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
    autres_retenues:      Number(watch("autres_retenues")) || 0,
    avances:              Number(watch("avances")) || 0,
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
      autres_retenues:      Number(data.autres_retenues) || 0,
      avances:              Number(data.avances) || 0,
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
      prime_transport: "0", autres_retenues: "0", avances: "0",
    });
    router.refresh();
  }

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
            </div>
          </div>

          {/* ── RETENUES DIVERSES ────────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Autres retenues (FCFA)</label>
              <Input type="number" min="0" step="1000" {...register("autres_retenues")} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Avances / Acomptes (FCFA)</label>
              <Input type="number" min="0" step="1000" {...register("avances")} className="mt-1" />
            </div>
          </div>

          {/* ── APERÇU ───────────────────────────────────────────────── */}
          {preview && (
            <div className="rounded-lg border bg-slate-50 p-4 space-y-1.5 text-sm">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide mb-2">
                Aperçu du bulletin
              </p>
              <div className="flex justify-between border-b pb-1.5 mb-1">
                <span className="text-muted-foreground">Total brut imposable</span>
                <span className="font-medium">{fmt(preview.total_imposable)}</span>
              </div>
              {nums.prime_transport > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>+ Transport (non imposable)</span>
                  <span>{fmt(nums.prime_transport)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total gains</span>
                <span>{fmt(preview.total_brut)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>− CNPS retraite (6,3%)</span>
                <span>{fmt(preview.cnps_salarie)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>− CMU salariale (forfait)</span>
                <span>{fmt(preview.cmu)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>− ITS (barème progressif)</span>
                <span>{fmt(preview.its)}</span>
              </div>
              {nums.autres_retenues > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>− Autres retenues</span>
                  <span>{fmt(nums.autres_retenues)}</span>
                </div>
              )}
              {nums.avances > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>− Avances / Acomptes</span>
                  <span>{fmt(nums.avances)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-emerald-700 text-base">
                <span>Net à payer</span>
                <span>{fmt(preview.salaire_net)}</span>
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
