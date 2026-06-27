"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Stethoscope } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  full_name: string;
  poste: string;
}

export function MedicalExamDialog({ employees }: { employees: Employee[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      employee_id: formData.get("employee_id"),
      type_examen: formData.get("type_examen"),
      date_examen: formData.get("date_examen"),
      resultat: formData.get("resultat"),
      recommandations: formData.get("recommandations"),
      prochaine_visite: formData.get("prochaine_visite") || null,
    };

    try {
      const res = await fetch("/api/medical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");

      toast.success("Examen médical enregistré avec succès");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2 bg-[#FF8200] hover:bg-[#E06D00] text-white shadow-sm font-semibold" />}>
        <Plus className="h-4 w-4" />
        Nouvel Examen
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[#FF8200]" />
              Enregistrer une Visite Médicale
            </DialogTitle>
            <DialogDescription>
              Saisie des résultats de la médecine du travail pour un collaborateur.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employé</Label>
              <Select name="employee_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.poste})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type_examen">Type d'examen</Label>
                <Select name="type_examen" defaultValue="PERIODIQUE">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRE_EMBAUCHE">Pré-embauche</SelectItem>
                    <SelectItem value="PERIODIQUE">Périodique</SelectItem>
                    <SelectItem value="REPRISE">Reprise</SelectItem>
                    <SelectItem value="SOUHAIT_EMPLOYE">À la demande (Employé)</SelectItem>
                    <SelectItem value="SOUHAIT_EMPLOYEUR">À la demande (Employeur)</SelectItem>
                    <SelectItem value="AUTRE">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_examen">Date de la visite</Label>
                <Input id="date_examen" name="date_examen" type="date" required className="focus-visible:ring-[#FF8200]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resultat">Aptitude</Label>
                <Select name="resultat" defaultValue="APTE">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APTE">Apte</SelectItem>
                    <SelectItem value="APTE_AVEC_RESERVES">Apte avec réserves</SelectItem>
                    <SelectItem value="INAPTE">Inapte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prochaine_visite">Prochaine visite (Optionnel)</Label>
                <Input id="prochaine_visite" name="prochaine_visite" type="date" className="focus-visible:ring-[#FF8200]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommandations">Recommandations / Restrictions</Label>
              <Textarea
                id="recommandations"
                name="recommandations"
                placeholder="Ex: Port de charges interdit, aménagement de poste..."
                rows={3}
                className="focus-visible:ring-[#FF8200]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#FF8200] hover:bg-[#E06D00] text-white shadow-sm font-semibold">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
