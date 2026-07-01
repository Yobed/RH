'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Loader2, Stethoscope, Calendar, FileText, AlertCircle, TrendingDown, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


interface Employee {
  id: string;
  full_name: string;
  date_embauche?: string;
  salaire_brut?: number;
  sursalaire?: number;
}

interface ArretMaladieDialogProps {
  employees: Employee[];
}

const schema = z.object({
  employee_id: z.string().uuid('Sélectionnez un employé'),
  date_debut: z.string().min(1, 'Date de début obligatoire'),
  date_fin: z.string().min(1, 'Date de fin obligatoire'),
  nb_jours: z.string().min(1, 'Durée obligatoire'),
  est_at: z.boolean(),
  commentaire: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

function calcDays(debut: string, fin: string): number {
  if (!debut || !fin) return 0;
  const d1 = new Date(debut);
  const d2 = new Date(fin);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  return Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export function ArretMaladieDialog({ employees }: ArretMaladieDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_id: '',
      date_debut: '',
      date_fin: '',
      nb_jours: '0',
      est_at: false,
      commentaire: '',
    },
  });

  const dateDebut = watch('date_debut');
  const dateFin = watch('date_fin');
  const nbJours = Number(watch('nb_jours'));

  const handleDateChange = (field: 'date_debut' | 'date_fin', value: string) => {
    setValue(field, value);
    const debut = field === 'date_debut' ? value : dateDebut;
    const fin = field === 'date_fin' ? value : dateFin;
    setValue('nb_jours', String(calcDays(debut, fin)));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) { setSelectedFile(null); return; }
    if (!ALLOWED_MIME.includes(file.type)) {
      setFileError('Format invalide. Acceptés : PDF, JPEG, PNG.');
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setFileError('Fichier trop volumineux (max 10 Mo).');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('employee_id', values.employee_id);
      formData.append('date_debut', values.date_debut);
      formData.append('date_fin', values.date_fin);
      formData.append('nb_jours', values.nb_jours);
      formData.append('est_at', String(values.est_at));
      if (values.commentaire) formData.append('commentaire', values.commentaire);
      if (selectedFile) formData.append('justificatif', selectedFile);

      const res = await fetch('/api/conges/arret', { method: 'POST', body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; details?: string };
        const msg = err?.details ? `${err.error} (${err.details})` : (err?.error ?? 'Erreur lors de la déclaration.');
        toast.error(msg);
        return;
      }

      toast.success('Arrêt maladie déclaré avec succès.');
      reset();
      setSelectedFile(null);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-slate-200 hover:bg-[#ee7f03]/10 hover:text-[#ee7f03] hover:border-[#ee7f03]/30 transition-all duration-300 shadow-sm rounded-xl"
        >
          <Stethoscope className="h-4 w-4 text-[#ee7f03]" />
          Déclarer un arrêt
        </Button>
      </DialogTrigger>

      {/* Pas d'overflow-hidden sur DialogContent — évite de clipper le dropdown Select */}
      <DialogContent className="max-w-xl p-0 bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col min-h-0"
        >
          {/* En-tête fixe */}
          <div className="bg-[#ee7f03]/5 px-6 py-5 border-b border-slate-100 rounded-t-2xl shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-[#ee7f03]/10 rounded-xl">
                  <Stethoscope className="h-5 w-5 text-[#ee7f03]" />
                </div>
                Déclarer un arrêt maladie
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                Enregistrez une absence médicale pour mettre à jour le planning et la paie.
              </p>
            </DialogHeader>
          </div>

          {/* Corps scrollable */}
          <div className="overflow-y-auto flex-1 px-6 py-6">
            <form id="arret-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Employé */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Sélection de l&apos;employé
                </Label>
                <Controller
                  control={control}
                  name="employee_id"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl hover:border-[#ee7f03]/50 focus:ring-2 focus:ring-[#ee7f03] transition-colors">
                        <SelectValue placeholder="Choisir un collaborateur..." />
                      </SelectTrigger>
                      {/* bg-white explicite pour éviter la transparence */}
                      <SelectContent className="z-[9999] bg-white border border-slate-200 shadow-xl rounded-xl">
                        {employees.map((e) => (
                          <SelectItem
                            key={e.id}
                            value={e.id}
                            className="cursor-pointer hover:bg-slate-50 rounded-lg"
                          >
                            {e.full_name ?? 'Employé sans nom'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.employee_id && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.employee_id.message}
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Date de début
                  </Label>
                  <Input
                    type="date"
                    className="h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-[#ee7f03]"
                    {...register('date_debut')}
                    onChange={(e) => handleDateChange('date_debut', e.target.value)}
                  />
                  {errors.date_debut && (
                    <p className="text-xs text-red-500">{errors.date_debut.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Date de fin
                  </Label>
                  <Input
                    type="date"
                    className="h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-[#ee7f03]"
                    {...register('date_fin')}
                    onChange={(e) => handleDateChange('date_fin', e.target.value)}
                  />
                  {errors.date_fin && (
                    <p className="text-xs text-red-500">{errors.date_fin.message}</p>
                  )}
                </div>
                </div>

              {/* Impact — conditionnel selon présence du justificatif */}
              <AnimatePresence mode="wait">
                {nbJours > 0 && (
                  watch('est_at') ? (
                    <motion.div
                      key="at-impact"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[#ee7f03]/10 border border-[#ee7f03]/30 rounded-xl p-4 flex items-start gap-3"
                    >
                      <div className="p-2 bg-[#ee7f03]/15 rounded-lg shrink-0">
                        <Stethoscope className="h-4 w-4 text-[#ee7f03]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-[#b35c00]">Accident de Travail (AT)</h4>
                        <p className="text-xs text-[#ee7f03] mt-0.5">
                          En cas d&apos;accident professionnel, le maintien de salaire est de <span className="font-bold">100%</span> (sous réserve de déclaration à la CNPS). 
                          L&apos;impact sur les conges est neutralisé pendant 12 mois.
                        </p>
                        <p className="text-[10px] text-[#ee7f03] italic mt-1 font-medium">
                          N&apos;oubliez pas de joindre la déclaration d&apos;AT CNPS.
                        </p>
                      </div>
                    </motion.div>
                  ) : selectedFile ? (
                    <motion.div
                      key="justifie"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3"
                    >
                      <div className="p-2 bg-emerald-100/80 rounded-lg shrink-0">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-emerald-900">Absence justifiée (CCI Art. 42)</h4>
                        <p className="text-xs text-emerald-700 mt-1">
                          Certificat médical fourni — absence justifiée. Aucune retenue salariale ne sera appliquée pour ces{' '}
                          <span className="font-bold">{nbJours} jour{nbJours > 1 ? 's' : ''}</span> (CCI Art. 42).
                        </p>
                        <p className="text-[10px] text-emerald-600 italic mt-1">
                          Le maintien s&apos;applique sur le salaire de base + ancienneté, sous réserve des droits restants.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="non-justifie"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
                    >
                      <div className="p-2 bg-amber-100/80 rounded-lg shrink-0">
                        <TrendingDown className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-amber-900">Absence non justifiée</h4>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Sans certificat médical, l&apos;absence de{' '}
                          <span className="font-bold">{nbJours} jour{nbJours > 1 ? 's' : ''}</span>{' '}
                          sera déduite du salaire brut (retenue pour absence).
                        </p>
                        {(() => {
                          const emp = employees.find(e => e.id === watch('employee_id'));
                          const base = (emp?.salaire_brut || 0) + (emp?.sursalaire || 0);
                          if (base > 0) {
                            const daily = base / 26;
                            const impact = Math.round(nbJours * daily);
                            return (
                              <p className="text-[10px] text-amber-700 mt-1 font-medium italic">
                                Impact estimé : -{new Intl.NumberFormat('fr-CI').format(impact)} FCFA.
                              </p>
                            );
                          }
                          return (
                            <p className="text-[10px] text-amber-700 mt-1 font-medium italic">
                              Impact estimé : -{new Intl.NumberFormat('fr-CI').format(Math.round(nbJours * 2500))} FCFA (indicatif).
                            </p>
                          );
                        })()}
                      </div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>

              {/* Accident de travail */}
              <div className="flex items-center gap-3 p-4 bg-slate-50/60 rounded-xl border border-slate-200">
                <Controller
                  control={control}
                  name="est_at"
                  render={({ field }) => (
                    <Checkbox
                      id="est_at"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-[#ee7f03] data-[state=checked]:border-[#ee7f03]"
                    />
                  )}
                />
                <div className="flex-1">
                  <Label htmlFor="est_at" className="cursor-pointer font-medium text-sm text-slate-800 flex items-center gap-2">
                    Accident de travail (AT)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px] bg-white border border-slate-200 text-slate-800">
                          L&apos;AT nécessite une déclaration CNPS sous 48h.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <p className="text-[10px] text-slate-500">Cochez si l&apos;arrêt est d&apos;origine professionnelle.</p>
                </div>
              </div>

              {/* Justificatif */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Justificatif médical
                  <span className="text-slate-400 font-normal ml-1">(optionnel — neutralise l&apos;impact salarial)</span>
                </Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="cursor-pointer file:cursor-pointer file:bg-[#ee7f03]/10 file:text-[#ee7f03] file:border-none file:rounded-lg file:px-3 file:py-1 file:mr-4 h-12 bg-white border-dashed border-2 border-slate-200 hover:border-[#ee7f03]/40 transition-all pt-2.5 rounded-xl"
                />
                {fileError ? (
                  <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" />
                    {fileError}
                  </p>
                ) : selectedFile ? (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                    <CheckCircle className="h-3 w-3" />
                    {selectedFile.name}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500">
                    PDF, JPG ou PNG · max 10 Mo
                  </p>
                )}
              </div>

              {/* Commentaire */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Observations</Label>
                <Textarea
                  rows={2}
                  className="bg-white border-slate-200 focus-visible:ring-[#ee7f03] rounded-xl transition-all resize-none"
                  placeholder="Détails supplémentaires sur la nature de l'arrêt..."
                  {...register('commentaire')}
                />
              </div>
            </form>
          </div>

          {/* Pied fixe */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl shrink-0">
            <Button
              type="button"
              variant="ghost"
              className="hover:bg-slate-200/50 text-slate-700 rounded-xl px-6"
              onClick={() => { setOpen(false); reset(); setSelectedFile(null); }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="arret-form"
              className="bg-[#ee7f03] hover:bg-[#d67002] text-white font-semibold rounded-xl px-8 shadow-md shadow-[#ee7f03]/20"
              disabled={loading || !!fileError}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Stethoscope className="mr-2 h-4 w-4" />
              )}
              Confirmer la déclaration
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
