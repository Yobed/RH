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
import { Info, Loader2, Stethoscope, Calendar, FileText, AlertCircle, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  full_name: string;
}

interface ArretMaladieDialogProps {
  employees: Employee[];
}

// ── Schema Zod ───────────────────────────────────────────────────────────────

const schema = z.object({
  employee_id: z.string().uuid('Sélectionnez un employé'),
  date_debut: z.string().min(1, 'Date de début obligatoire'),
  date_fin: z.string().min(1, 'Date de fin obligatoire'),
  nb_jours: z.string().min(1, 'Durée obligatoire'),
  est_at: z.boolean(),
  commentaire: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Utilitaire : calcul jours calendaires ────────────────────────────────────

function calcDays(debut: string, fin: string): number {
  if (!debut || !fin) return 0;
  const d1 = new Date(debut);
  const d2 = new Date(fin);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, diff);
}

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

// ── Composant ────────────────────────────────────────────────────────────────

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
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err?.error ?? 'Erreur lors de la déclaration.');
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
          className="gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 shadow-sm"
        >
          <Stethoscope className="h-4 w-4 text-primary" />
          Déclarer un arrêt
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl p-0 border-none bg-transparent shadow-none overflow-visible">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
        >
          <div className="bg-primary/5 p-6 border-b border-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Stethoscope className="w-24 h-24" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                Déclarer un arrêt maladie
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Enregistrez une absence médicale pour mettre à jour le planning et la paie.
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid gap-6">
              {/* Employé */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Sélection de l&apos;employé
                </Label>
                <Controller
                  control={control}
                  name="employee_id"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/10 hover:border-primary/30 transition-colors">
                        <SelectValue placeholder="Choisir un collaborateur..." />
                      </SelectTrigger>
                      <SelectContent className="z-[10000] bg-popover shadow-xl border-border/50">
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={e.id} className="cursor-pointer">
                            {e.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.employee_id && (
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-destructive font-medium flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {errors.employee_id.message}
                  </motion.p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Date de début
                  </Label>
                  <Input
                    type="date"
                    className="h-11 bg-muted/30 border-muted-foreground/10"
                    {...register('date_debut')}
                    onChange={(e) => handleDateChange('date_debut', e.target.value)}
                  />
                  {errors.date_debut && (
                    <p className="text-xs text-destructive">{errors.date_debut.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Date de fin
                  </Label>
                  <Input
                    type="date"
                    className="h-11 bg-muted/30 border-muted-foreground/10"
                    {...register('date_fin')}
                    onChange={(e) => handleDateChange('date_fin', e.target.value)}
                  />
                  {errors.date_fin && (
                    <p className="text-xs text-destructive">{errors.date_fin.message}</p>
                  )}
                </div>
              </div>

              {/* Impact Analyste */}
              <AnimatePresence>
                {Number(watch('nb_jours')) > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-start gap-3"
                  >
                    <div className="p-2 bg-accent/20 rounded-lg shrink-0">
                      <TrendingDown className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-accent-foreground">Impact Estimé</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cette absence de <span className="font-bold text-foreground">{watch('nb_jours')} jours</span> 
                        impactera le calcul de l&apos;indemnité compensatrice de congé et la prime de rendement.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Accident de travail & Fichier */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-xl border border-border/50">
                  <Controller
                    control={control}
                    name="est_at"
                    render={({ field }) => (
                      <Checkbox
                        id="est_at"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-5 w-5 rounded-md border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    )}
                  />
                  <div className="flex-1">
                    <Label htmlFor="est_at" className="cursor-pointer font-medium text-sm flex items-center gap-2">
                      Accident de travail (AT)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[200px]">
                            L&apos;AT nécessite une déclaration CNPS sous 48h.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Cochez si l&apos;arrêt est d&apos;origine professionnelle.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Justificatif Médical (Optionnel)</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="cursor-pointer file:cursor-pointer file:bg-primary/10 file:text-primary file:border-none file:rounded-md file:px-3 file:py-1 file:mr-4 h-12 bg-muted/10 border-dashed border-2 hover:border-primary/30 transition-all pt-2.5"
                    />
                  </div>
                  {fileError ? (
                    <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" />
                      {fileError}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      Format accepté : PDF, JPG, PNG (Max 10Mo). Un justificatif marque l&apos;arrêt comme &quot;Approuvé&quot;.
                    </p>
                  )}
                </div>
              </div>

              {/* Commentaire */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Observations de l&apos;analyste</Label>
                <Textarea
                  rows={2}
                  className="bg-muted/30 border-muted-foreground/10 focus:border-primary/50 transition-all"
                  placeholder="Détails supplémentaires sur la nature de l'arrêt..."
                  {...register('commentaire')}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50 bg-muted/5 -mx-6 px-6 -mb-6 py-4 rounded-b-2xl">
              <Button
                type="button"
                variant="ghost"
                className="hover:bg-muted/50 rounded-xl px-6"
                onClick={() => { setOpen(false); reset(); setSelectedFile(null); }}
                disabled={loading}
              >
                Ignorer
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 rounded-xl px-8 shadow-lg shadow-primary/20"
                disabled={loading || !!fileError}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Stethoscope className="mr-2 h-4 w-4" />
                )}
                Confirmer la Déclaration
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
