"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface EmployeeOption {
  id: string;
  full_name: string;
  poste?: string | null;
}

interface DeadlineState {
  message: string;
  level: "info" | "warn" | "danger";
}

const DELAI_NOTIFICATION_MAX_JOURS = 60; // Art. 28.2 CT-CI : 2 mois max

function computeDeadline(dateIncident: string | null): DeadlineState | null {
  if (!dateIncident) return null;
  const incident = new Date(dateIncident);
  if (isNaN(incident.getTime())) return null;
  const deadline = new Date(incident);
  deadline.setDate(deadline.getDate() + DELAI_NOTIFICATION_MAX_JOURS);
  const now = new Date();
  const remaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const deadlineLabel = deadline.toLocaleDateString("fr-CI", {
    day: "2-digit", month: "long", year: "numeric",
  });

  if (remaining < 0) {
    return {
      message: `Délai légal dépassé de ${Math.abs(remaining)} jour(s). La sanction risque l'annulation pour vice de procédure (Art. 28.2 CT-CI).`,
      level: "danger",
    };
  }
  if (remaining <= 14) {
    return {
      message: `Notification à effectuer avant le ${deadlineLabel} — ${remaining} jour(s) restant(s).`,
      level: "warn",
    };
  }
  return {
    message: `Notification possible jusqu'au ${deadlineLabel} (${remaining} jours restants — Art. 28.2 CT-CI : 60 jours max).`,
    level: "info",
  };
}

export function DisciplinaryDialog({ employees }: { employees: EmployeeOption[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateIncident, setDateIncident] = useState<string>("");
  const [type, setType] = useState<string>("");
  const router = useRouter();

  const deadline = useMemo(() => computeDeadline(dateIncident), [dateIncident]);

  const isFauteGrave = type === "MISE_A_PIED" || type === "LICENCIEMENT";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      employee_id: formData.get("employee_id"),
      type: formData.get("type"),
      statut: "EN_COURS",
      motif: formData.get("motif"),
      date_incident: formData.get("date_incident") || null,
      date_convocation: formData.get("date_convocation") || null,
      date_audition: formData.get("date_audition") || null,
    };

    try {
      const res = await fetch("/api/disciplinaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur de création");
      toast.success("Procédure initiée");
      setOpen(false);
      setDateIncident("");
      setType("");
      router.refresh();
    } catch {
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
            Nouvelle procédure
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Initier une procédure disciplinaire</DialogTitle>
          <DialogDescription className="text-xs">
            Workflow conforme aux Art. 28 et 29 du Code du travail ivoirien.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee_id">Salarié *</Label>
            <Select name="employee_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un salarié" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.poste || "Sans poste"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de procédure *</Label>
            <Select name="type" required value={type} onValueChange={(v) => setType(v ?? "")}>
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
            {isFauteGrave && (
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Faute grave : convocation préalable obligatoire avec délai minimum
                de 48 h entre la convocation et l'audition (Art. 29 CT-CI).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_incident">Date des faits *</Label>
            <Input
              type="date"
              id="date_incident"
              name="date_incident"
              required
              value={dateIncident}
              onChange={(e) => setDateIncident(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
            {deadline && (
              <div
                className={[
                  "rounded-md border px-3 py-2 text-xs flex items-start gap-2",
                  deadline.level === "danger" && "border-rose-200 bg-rose-50/60 text-rose-900",
                  deadline.level === "warn" && "border-amber-200 bg-amber-50/60 text-amber-900",
                  deadline.level === "info" && "border-slate-200 bg-slate-50 text-slate-700",
                ].filter(Boolean).join(" ")}
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{deadline.message}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date_convocation" className="text-xs">
                Date de convocation
              </Label>
              <Input type="date" id="date_convocation" name="date_convocation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_audition" className="text-xs">
                Date d'audition
              </Label>
              <Input type="date" id="date_audition" name="date_audition" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Motif / Description des faits *</Label>
            <Textarea
              id="motif"
              name="motif"
              required
              minLength={10}
              rows={4}
              placeholder="Détaillez les faits reprochés (lieu, témoins, conséquences)…"
            />
            <p className="text-[10px] text-slate-500 leading-snug">
              Le motif doit être précis et factuel. Une description vague rendrait
              la sanction attaquable pour défaut de cause réelle et sérieuse.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création…" : "Initier la procédure"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
