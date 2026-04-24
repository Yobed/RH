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
import { Info, Loader2, Stethoscope } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  prenom: string;
  nom: string;
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
        <Button variant="outline" className="gap-2">
          <Stethoscope className="h-4 w-4" />
          Déclarer un arrêt
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Déclarer un arrêt maladie</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Employé */}
          <div className="space-y-1">
            <Label>Employé</Label>
            <Controller
              control={control}
              name="employee_id"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.prenom} {e.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.employee_id && (
              <p className="text-xs text-destructive">{errors.employee_id.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Date de début</Label>
              <Input
                type="date"
                {...register('date_debut')}
                onChange={(e) => handleDateChange('date_debut', e.target.value)}
              />
              {errors.date_debut && (
                <p className="text-xs text-destructive">{errors.date_debut.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Date de fin</Label>
              <Input
                type="date"
                {...register('date_fin')}
                onChange={(e) => handleDateChange('date_fin', e.target.value)}
              />
              {errors.date_fin && (
                <p className="text-xs text-destructive">{errors.date_fin.message}</p>
              )}
            </div>
          </div>

          {/* Nb jours */}
          <div className="space-y-1">
            <Label>Nombre de jours</Label>
            <Input
              type="number"
              min={0}
              readOnly
              className="bg-muted"
              {...register('nb_jours')}
            />
          </div>

          {/* Accident de travail */}
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="est_at"
              render={({ field }) => (
                <Checkbox
                  id="est_at"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="est_at" className="cursor-pointer font-normal">
              Accident de travail (AT)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  L&apos;AT doit faire l&apos;objet d&apos;une déclaration CNPS séparée.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Certificat médical */}
          <div className="space-y-1">
            <Label>Certificat médical (optionnel)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              PDF, JPEG ou PNG — max 10 Mo. Si fourni, l&apos;arrêt sera marqué &quot;Justifié&quot;.
            </p>
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          {/* Commentaire */}
          <div className="space-y-1">
            <Label>Commentaire (optionnel)</Label>
            <Textarea
              rows={2}
              placeholder="Ex : maladie ordinaire, suite à chute…"
              {...register('commentaire')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setOpen(false); reset(); setSelectedFile(null); }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !!fileError}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Déclarer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
