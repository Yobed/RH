"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { calculerBulletin } from "@/lib/paie-ci";

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

type Employee = Pick<Tables<"employees">, "id" | "full_name" | "matricule" | "salaire_brut">;

const schema = z.object({
  employee_id: z.string().uuid("Sélectionnez un employé"),
  periode: z.string().regex(/^\d{4}-\d{2}$/, "Format YYYY-MM"),
  salaire_brut: z.string().min(1, "Salaire brut requis"),
  autres_retenues: z.string().optional(),
  avances: z.string().optional(),
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

interface Props { employees: Employee[] }

export function PaieDialog({ employees }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof calculerBulletin> | null>(null);
  const router = useRouter();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { periode: currentPeriode(), autres_retenues: "0", avances: "0" },
  });

  const [brut, retenues, avances, empId] = [
    watch("salaire_brut"), watch("autres_retenues"), watch("avances"), watch("employee_id"),
  ];

  // Auto-remplir salaire depuis l'employé sélectionné
  useEffect(() => {
    if (empId) {
      const emp = employees.find((e) => e.id === empId);
      if (emp?.salaire_brut) setValue("salaire_brut", String(emp.salaire_brut));
    }
  }, [empId, employees, setValue]);

  // Prévisualisation calcul
  useEffect(() => {
    const b = Number(brut);
    if (b > 0) {
      setPreview(calculerBulletin(b, Number(retenues) || 0, Number(avances) || 0));
    } else {
      setPreview(null);
    }
  }, [brut, retenues, avances]);

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/paie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        salaire_brut: Number(data.salaire_brut),
        autres_retenues: Number(data.autres_retenues) || 0,
        avances: Number(data.avances) || 0,
      }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success("Bulletin de paie créé");
    setOpen(false);
    reset({ periode: currentPeriode(), autres_retenues: "0", avances: "0" });
    setPreview(null);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon className="mr-2 h-4 w-4" />
        Nouveau bulletin
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nouveau bulletin de paie</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
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
            <label className="text-sm font-medium">Période * (YYYY-MM)</label>
            <Input type="month" {...register("periode")} className="mt-1" />
            {errors.periode && <p className="mt-1 text-xs text-red-500">{errors.periode.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Salaire brut (FCFA) *</label>
            <Input type="number" min="0" step="1000" {...register("salaire_brut")} className="mt-1" />
            {errors.salaire_brut && <p className="mt-1 text-xs text-red-500">{errors.salaire_brut.message}</p>}
          </div>

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

          {/* Aperçu calcul */}
          {preview && (
            <div className="rounded-lg border bg-slate-50 p-4 space-y-2 text-sm">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Aperçu du bulletin</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Salaire brut</span>
                  <span className="font-medium">{fmt(preview.salaire_brut)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>CNPS salarié (4,4%)</span>
                  <span>− {fmt(preview.cnps_salarie)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>ITS (retenue à la source)</span>
                  <span>− {fmt(preview.its)}</span>
                </div>
                {preview.salaire_brut - preview.salaire_net_avant_retenues < preview.salaire_brut && (
                  <>
                    {Number(retenues) > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Autres retenues</span>
                        <span>− {fmt(Number(retenues))}</span>
                      </div>
                    )}
                    {Number(avances) > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Avances / Acomptes</span>
                        <span>− {fmt(Number(avances))}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-emerald-700">
                  <span>Net à payer</span>
                  <span>{fmt(preview.salaire_net)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Base ITS imposable : {fmt(preview.base_imposable)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Création..." : "Créer le bulletin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
