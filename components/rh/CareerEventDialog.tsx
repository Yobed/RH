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

const schema = z.object({
  event_type: z.enum(["promotion", "mutation", "augmentation", "formation", "avenant", "autre"]),
  date_event: z.string().min(1, "Date obligatoire"),
  description: z.string().min(2, "Description obligatoire"),
  details: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CareerEventDialog({ employeeId, companyId }: { employeeId: string; companyId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date_event: new Date().toISOString().split("T")[0],
      event_type: "promotion",
    },
  });

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch("/api/career-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          company_id: companyId,
          event_type: data.event_type,
          date_event: data.date_event,
          description: data.description,
          new_value: data.details ? { info: data.details } : null,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de l'ajout");

      toast.success("Événement ajouté avec succès");
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Échec de l'ajout de l'événement");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Ajouter un événement
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvel événement de carrière</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Type d'événement</label>
            <select
              {...register("event_type")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="promotion">Promotion</option>
              <option value="mutation">Mutation</option>
              <option value="augmentation">Augmentation</option>
              <option value="formation">Formation</option>
              <option value="avenant">Avenant</option>
              <option value="autre">Autre / Événement divers</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input type="date" {...register("date_event")} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input 
              {...register("description")} 
              placeholder="Ex: Passage au grade de Senior Manager" 
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Détails ou modifications (optionnel)</label>
            <Input 
              {...register("details")} 
              placeholder="Ex: Agence d'Abobo, +50k FCFA..." 
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer l'événement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
