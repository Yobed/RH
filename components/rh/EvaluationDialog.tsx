"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/types/supabase";

type Employee = Pick<Tables<"employees">, "id" | "full_name" | "poste">;

interface Props {
  employees: Employee[];
}

const schema = z.object({
  employee_id: z.string().uuid("Sélectionnez un employé"),
  type: z.enum(["ANNUELLE", "SEMESTRIELLE", "TRIMESTRIELLE", "MENSUELLE", "PERIODE_ESSAI", "AUTRE"]),
  titre: z.string().min(1, "Titre obligatoire").max(100),
  date_prevue: z.string().min(1, "Date obligatoire"),
  technique: z.string().optional(),
  comportement: z.string().optional(),
  ponctualite: z.string().optional(),
  initiative: z.string().optional(),
  evaluateur_id: z.string().optional(),
  commentaires_evaluateur: z.string().max(2000).optional(),
  commentaires_employe: z.string().max(2000).optional(),
  objectifs_futurs: z.string().max(2000).optional(),
  statut: z.enum(["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]),
});

type FormData = z.infer<typeof schema>;

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function ScoreInput({
  label,
  name,
  register,
}: {
  label: string;
  name: "technique" | "comportement" | "ponctualite" | "initiative";
  register: ReturnType<typeof useForm<FormData>>["register"];
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label} (0–100)</label>
      <Input
        type="number"
        min="0"
        max="100"
        step="1"
        {...register(name)}
        placeholder="—"
        className="mt-1"
      />
    </div>
  );
}

export function EvaluationDialog({ employees }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "ANNUELLE",
      statut: "PLANIFIEE",
      date_prevue: new Date().toISOString().split("T")[0],
    },
  });

  // Aperçu du score moyen en temps réel
  const [t, c, p, i] = [
    watch("technique"),
    watch("comportement"),
    watch("ponctualite"),
    watch("initiative"),
  ];
  const vals = [t, c, p, i]
    .map(Number)
    .filter((v) => !isNaN(v) && v >= 0 && v <= 100);
  const preview = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;

  async function onSubmit(data: FormData) {
    const scores: Record<string, number> = {};
    if (data.technique) scores.technique = Number(data.technique);
    if (data.comportement) scores.comportement = Number(data.comportement);
    if (data.ponctualite) scores.ponctualite = Number(data.ponctualite);
    if (data.initiative) scores.initiative = Number(data.initiative);

    const payload = {
      employee_id: data.employee_id,
      type: data.type,
      titre: data.titre,
      date_prevue: data.date_prevue,
      criteres_evaluation: scores,
      statut: data.statut,
      evaluateur_id: data.evaluateur_id || null,
      commentaires_evaluateur: data.commentaires_evaluateur || null,
      commentaires_employe: data.commentaires_employe || null,
      objectifs_futurs: data.objectifs_futurs || null,
    };

    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? "Erreur serveur");
      return;
    }

    toast.success("Évaluation créée");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-12 px-6 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg hover:shadow-primary/20 transition-all gap-2 group">
          <PlusIcon className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          Nouvelle évaluation
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none shadow-[0_30px_100px_rgba(0,0,0,0.25)] rounded-[2.5rem]">
        <div className="bg-slate-900 p-8 text-white relative">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <PlusIcon size={80} />
           </div>
           <DialogHeader>
             <DialogTitle className="text-3xl font-black tracking-tightest">Règlement de Performance</DialogTitle>
             <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-1">Initialiser un nouveau cycle d'audit</p>
           </DialogHeader>
        </div>

        <div className="p-8 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Employé & période */}
            <section className="space-y-5">
              <div className="flex items-center gap-3">
                 <div className="h-0.5 w-6 bg-primary" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Collaborateur & Cycle</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="col-span-full">
                  <label className="text-[11px] font-black uppercase text-slate-600 ml-1">Employé à auditer</label>
                  <select {...register("employee_id")} className={`mt-2 ${selectClass} h-12 rounded-xl bg-slate-50 border-slate-200 font-bold focus:ring-primary/20`}>
                    <option value="">— Sélectionner —</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.full_name} ({e.poste})
                      </option>
                    ))}
                  </select>
                  {errors.employee_id && (
                    <p className="mt-2 text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                      <span className="h-1 w-1 bg-red-500 rounded-full" />
                      {errors.employee_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 ml-1">Type de revue</label>
                  <select {...register("type")} className={`mt-2 ${selectClass} h-12 rounded-xl bg-slate-50 border-slate-200 font-bold`}>
                    <option value="ANNUELLE">Annuelle</option>
                    <option value="SEMESTRIELLE">Semestrielle</option>
                    <option value="TRIMESTRIELLE">Trimestrielle</option>
                    <option value="MENSUELLE">Mensuelle</option>
                    <option value="PERIODE_ESSAI">Période d'essai</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 ml-1">Date d'échéance</label>
                  <Input type="date" {...register("date_prevue")} className="mt-2 h-12 rounded-xl bg-slate-50 border-slate-200 font-bold" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 ml-1">Désignation de la campagne</label>
                <Input
                  {...register("titre")}
                  placeholder="Ex: Évaluation Annuelle 2026"
                  className="mt-2 h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"
                />
                {errors.titre && (
                  <p className="mt-2 text-[10px] font-bold text-red-500 uppercase">{errors.titre.message}</p>
                )}
              </div>
            </section>

            {/* Critères de notation */}
            <section className="space-y-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-0.5 w-6 bg-emerald-500" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Score de Performance</p>
                </div>
                {preview !== null && (
                  <Badge className={`rounded-lg px-3 py-1 font-black ${
                      preview >= 75
                        ? "bg-emerald-500/10 text-emerald-600"
                        : preview >= 40
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-red-500/10 text-red-600"
                    }`}
                  >
                    PREVIEW: {preview}%
                  </Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ScoreInput label="Compétences techniques" name="technique" register={register} />
                <ScoreInput label="Comportement" name="comportement" register={register} />
                <ScoreInput label="Ponctualité" name="ponctualite" register={register} />
                <ScoreInput label="Initiative" name="initiative" register={register} />
              </div>
            </section>

            {/* Évaluateur */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-0.5 w-6 bg-blue-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Évaluateur & Commentaires</p>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 ml-1">Évaluateur responsable</label>
                <select {...register("evaluateur_id")} className={`mt-2 ${selectClass} h-12 rounded-xl bg-slate-50 border-slate-200 font-bold`}>
                  <option value="">— À désigner —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name} ({e.poste})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 ml-1">Commentaires évaluateur</label>
                <Textarea
                  {...register("commentaires_evaluateur")}
                  placeholder="Appréciation générale, points forts, axes d'amélioration..."
                  className="mt-2 rounded-xl bg-slate-50 border-slate-200 min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 ml-1">Auto-évaluation employé</label>
                <Textarea
                  {...register("commentaires_employe")}
                  placeholder="Bilan personnel, difficultés rencontrées, attentes..."
                  className="mt-2 rounded-xl bg-slate-50 border-slate-200 min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 ml-1">Objectifs & Plan de développement</label>
                <Textarea
                  {...register("objectifs_futurs")}
                  placeholder="Objectifs pour la prochaine période, formations, promotions envisagées..."
                  className="mt-2 rounded-xl bg-slate-50 border-slate-200 min-h-[80px]"
                />
              </div>
            </section>

            {/* Statut */}
            <div className="pt-4 border-t border-slate-100">
              <label className="text-[11px] font-black uppercase text-slate-600 ml-1">Flux initial</label>
              <select {...register("statut")} className={`mt-2 ${selectClass} h-12 rounded-xl bg-slate-50 border-slate-200 font-bold`}>
                <option value="PLANIFIEE">À planifier</option>
                <option value="EN_COURS">Démarrer immédiatement</option>
                <option value="TERMINEE">Classer comme terminé</option>
              </select>
            </div>

            <DialogFooter className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
               <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-black uppercase text-[10px] h-12 px-6">
                 Annuler
               </Button>
               <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black uppercase text-[11px] h-12 px-10 shadow-lg shadow-primary/20">
                {isSubmitting ? "Initialisation..." : "Valider le cycle"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
