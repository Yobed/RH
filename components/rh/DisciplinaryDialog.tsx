"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

export function DisciplinaryDialog({ employees }: { employees: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      employee_id: formData.get("employee_id"),
      type: formData.get("type"),
      statut: "EN_COURS",
      motif: formData.get("motif"),
      date_incident: formData.get("date_incident") || null,
    };

    try {
      const res = await fetch("/api/disciplinaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Erreur de création");

      toast.success("Procédure initiée avec succès");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouvelle Procédure
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initier une procédure</DialogTitle>
          <DialogDescription>
            Remplissez ce formulaire pour créer une nouvelle procédure conforme au droit CI.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee_id">Employé</Label>
            <Select name="employee_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.poste || 'Aucun poste'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type de Procédure</Label>
            <Select name="type" required>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEMANDE_EXPLICATION">Demande d'explication</SelectItem>
                <SelectItem value="AVERTISSEMENT">Avertissement</SelectItem>
                <SelectItem value="MISE_A_PIED">Mise à pied</SelectItem>
                <SelectItem value="LICENCIEMENT">Licenciement</SelectItem>
                <SelectItem value="AUTRE">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_incident">Date de l'incident (Optionnel)</Label>
            <Input type="date" id="date_incident" name="date_incident" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motif">Motif / Description des faits</Label>
            <Textarea id="motif" name="motif" required minLength={10} rows={4} placeholder="Détaillez les faits reprochés..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
