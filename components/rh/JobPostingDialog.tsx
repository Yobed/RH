"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Plus, 
  X, 
  Briefcase, 
  Calendar, 
  CurrencyCircleDollar, 
  ChartBar,
  Stack,
  CheckCircle,
  FileText
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

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
import { cn } from "@/lib/utils";

const schema = z.object({
  titre: z.string().min(2, "Titre obligatoire").max(200),
  description: z.string().min(10, "Description obligatoire").max(5000),
  type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage", ""]).optional(),
  experience_min: z.string().optional(),
  salaire_min: z.string().optional(),
  salaire_max: z.string().optional(),
  date_limite: z.string().optional(),
  statut: z.enum(["ouvert", "fermé", "brouillon"]),
  is_internal: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const selectClass =
  "w-full rounded-xl border-slate-200 bg-white/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-slate-300";

const labelClass = "text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5";

export function JobPostingDialog() {
  const [open, setOpen] = useState(false);
  const [competences, setCompetences] = useState<string[]>([]);
  const [competenceInput, setCompetenceInput] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { statut: "ouvert", type_contrat: "", is_internal: false },
  });

  function addCompetence() {
    const val = competenceInput.trim();
    if (val && !competences.includes(val) && competences.length < 20) {
      setCompetences((prev) => [...prev, val]);
      setCompetenceInput("");
    }
  }

  function removeCompetence(c: string) {
    setCompetences((prev) => prev.filter((x) => x !== c));
  }

  function handleCompetenceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCompetence();
    }
  }

  async function onSubmit(data: FormData) {
    const payload = {
      ...data,
      type_contrat: data.type_contrat || null,
      experience_min: data.experience_min ? Number(data.experience_min) : null,
      salaire_min: data.salaire_min ? Number(data.salaire_min) : null,
      salaire_max: data.salaire_max ? Number(data.salaire_max) : null,
      date_limite: data.date_limite || null,
      competences: competences.length > 0 ? competences : null,
      is_internal: data.is_internal ?? false,
    };

    try {
      const res = await fetch("/api/recrutement/postes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur serveur");
        return;
      }

      toast.success("Offre d'emploi créée avec succès", {
        icon: <CheckCircle weight="fill" className="text-green-500 w-5 h-5" />,
        className: "rounded-2xl border-none shadow-2xl bg-white",
      });
      setOpen(false);
      reset();
      setCompetences([]);
      router.refresh();
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition-all duration-200 gap-2"
        >
          <Plus weight="bold" className="h-4 w-4" />
          <span>Nouvelle offre</span>
        </motion.button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl overflow-hidden rounded-[2rem] border-none p-0 !bg-transparent shadow-none">
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-900/5 text-slate-900">
                <Briefcase size={28} weight="duotone" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                  Publier une offre
                </DialogTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Créez une nouvelle opportunité de carrière
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-8 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
            {/* Informations principales */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                Informations du Poste
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    <FileText weight="duotone" />
                    Intitulé du poste
                  </label>
                  <Input 
                    {...register("titre")} 
                    placeholder="ex: Design Lead, Fullstack Dev..." 
                    className="rounded-xl bg-white/50 border-slate-200 focus:bg-white transition-all h-11"
                  />
                  {errors.titre && (
                    <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
                      <X className="w-3 h-3" /> {errors.titre.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    <Stack weight="duotone" />
                    Description détaillée
                  </label>
                  <Textarea
                    {...register("description")}
                    placeholder="Missions, responsabilités, environnement technique..."
                    className="rounded-xl bg-white/50 border-slate-200 min-h-[160px] focus:bg-white transition-all"
                  />
                  {errors.description && (
                    <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
                      <X className="w-3 h-3" /> {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      <Briefcase weight="duotone" />
                      Contrat
                    </label>
                    <select {...register("type_contrat")} className={selectClass}>
                      <option value="">— Sélectionner —</option>
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="Stage">Stage</option>
                      <option value="Apprentissage">Apprentissage</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      <ChartBar weight="duotone" />
                      Expérience (ans)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      {...register("experience_min")}
                      placeholder="ex: 3"
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Compétences */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                Compétences techniques
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <Input
                    value={competenceInput}
                    onChange={(e) => setCompetenceInput(e.target.value)}
                    onKeyDown={handleCompetenceKeyDown}
                    placeholder="ex: React, Tailwind, SQL..."
                    className="flex-1 bg-white border-none shadow-sm h-10"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={addCompetence}
                    className="rounded-xl h-10 hover:bg-slate-200"
                  >
                    <Plus weight="bold" />
                  </Button>
                </div>

                <AnimatePresence>
                  {competences.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap gap-2"
                    >
                      {competences.map((c) => (
                        <motion.span
                          key={c}
                          layout
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-medium"
                        >
                          {c}
                          <button
                            type="button"
                            onClick={() => removeCompetence(c)}
                            className="hover:text-red-300 transition-colors"
                          >
                            <X weight="bold" size={12} />
                          </button>
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Rémunération & Statut */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                Détails & Conditions
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    <CurrencyCircleDollar weight="duotone" />
                    Fourchette Salariale (Min)
                  </label>
                  <Input
                    type="number"
                    {...register("salaire_min")}
                    placeholder="Min"
                    className="rounded-xl h-11"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <div className="w-5" />
                    Salaire (Max)
                  </label>
                  <Input
                    type="number"
                    {...register("salaire_max")}
                    placeholder="Max"
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    <Calendar weight="duotone" />
                    Date limite
                  </label>
                  <Input type="date" {...register("date_limite")} className="rounded-xl h-11" />
                </div>
                <div>
                  <label className={labelClass}>
                    <Stack weight="duotone" />
                    Publication
                  </label>
                  <select {...register("statut")} className={selectClass}>
                    <option value="ouvert">Public (Ouvert)</option>
                    <option value="brouillon">Brouillon</option>
                    <option value="fermé">Fermé</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 cursor-pointer hover:bg-blue-50 transition-colors group">
                <div className="relative">
                  <input
                    type="checkbox"
                    {...register("is_internal")}
                    className="peer appearance-none h-5 w-5 rounded border-slate-300 bg-white checked:bg-slate-900 checked:border-slate-900 transition-all cursor-pointer"
                  />
                  <CheckCircle 
                    weight="bold"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Recrutement interne uniquement</span>
                  <span className="text-xs text-slate-500">Ce poste ne sera visible que pour les employés actuels (mobilité).</span>
                </div>
              </label>
            </div>

            <DialogFooter className="pt-4 sticky bottom-0 bg-white/5 backdrop-blur-sm -mx-8 px-8 mt-4 border-t border-slate-100">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <ChartBar size={20} weight="bold" />
                  </motion.div>
                ) : (
                  "Publier l'offre"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
