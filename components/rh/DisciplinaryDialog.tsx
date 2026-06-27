"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  WarningOctagon, 
  User, 
  Calendar, 
  FileText, 
  Plus, 
  WarningCircle, 
  CheckCircle,
  X 
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
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

const labelClass = "text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5";

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
      toast.success("Procédure initiée avec succès", {
        icon: <CheckCircle weight="fill" className="text-emerald-500 w-5 h-5" />,
        className: "rounded-2xl border-none shadow-2xl bg-white",
      });
      setOpen(false);
      setDateIncident("");
      setType("");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la création de la procédure");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center justify-center rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-[#2563eb]/20 transition-all duration-200 gap-2"
        >
          <Plus weight="bold" className="h-4 w-4" />
          <span>Nouvelle procédure</span>
        </motion.button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl overflow-hidden rounded-[2rem] border-none p-0 !bg-transparent shadow-none">
        <div className="bg-white border border-slate-200 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh] relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2563eb]" />

          <DialogHeader className="p-8 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#2563eb]/10 text-[#2563eb]">
                <WarningOctagon size={28} weight="duotone" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                  Procédure Disciplinaire
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Conforme aux Art. 28 et 29 du Code du travail ivoirien
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={onSubmit} className="px-8 pb-8 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
            {/* ── CONCERNE ─────────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                Salarié &amp; Nature des faits
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    <User weight="duotone" />
                    Salarié *
                  </label>
                  <Select name="employee_id" required>
                    <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-[#2563eb] focus:border-[#2563eb] focus:ring-2">
                      <SelectValue placeholder="Sélectionner un salarié" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-xl rounded-xl z-[9999]">
                      {employees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="cursor-pointer hover:bg-slate-50 rounded-lg">
                          {emp.full_name} ({emp.poste || "Sans poste"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className={labelClass}>
                    <WarningOctagon weight="duotone" />
                    Type de procédure *
                  </label>
                  <Select name="type" required value={type} onValueChange={(v) => setType(v ?? "")}>
                    <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-[#2563eb] focus:border-[#2563eb] focus:ring-2">
                      <SelectValue placeholder="Choisir un type de sanction ou demande" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-xl rounded-xl z-[9999]">
                      <SelectItem value="DEMANDE_EXPLICATION" className="cursor-pointer hover:bg-slate-50 rounded-lg">Demande d'explication</SelectItem>
                      <SelectItem value="AVERTISSEMENT" className="cursor-pointer hover:bg-slate-50 rounded-lg">Avertissement</SelectItem>
                      <SelectItem value="MISE_A_PIED" className="cursor-pointer hover:bg-slate-50 rounded-lg">Mise à pied</SelectItem>
                      <SelectItem value="LICENCIEMENT" className="cursor-pointer hover:bg-slate-50 rounded-lg">Licenciement</SelectItem>
                      <SelectItem value="AUTRE" className="cursor-pointer hover:bg-slate-50 rounded-lg">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  {isFauteGrave && (
                    <p className="mt-2 text-[11px] text-amber-800 bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 leading-relaxed flex items-start gap-2">
                      <WarningCircle weight="fill" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Faute grave : convocation préalable obligatoire avec délai minimum de 48 h entre la convocation et l'audition (Art. 29 CT-CI).</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── CHRONOLOGIE ──────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                Chronologie &amp; Délais Légaux
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    <Calendar weight="duotone" />
                    Date des faits *
                  </label>
                  <Input
                    type="date"
                    id="date_incident"
                    name="date_incident"
                    required
                    value={dateIncident}
                    onChange={(e) => setDateIncident(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="rounded-xl h-11 focus-visible:ring-[#2563eb]"
                  />
                  {deadline && (
                    <div
                      className={[
                        "mt-2.5 rounded-xl border p-3 text-xs flex items-start gap-2.5 transition-all",
                        deadline.level === "danger" && "border-rose-200 bg-rose-50/80 text-rose-900",
                        deadline.level === "warn" && "border-amber-200 bg-amber-50/80 text-amber-900",
                        deadline.level === "info" && "border-slate-200 bg-slate-50/80 text-slate-700",
                      ].filter(Boolean).join(" ")}
                    >
                      <WarningCircle weight="fill" className={`h-4 w-4 shrink-0 mt-0.5 ${
                        deadline.level === "danger" ? "text-rose-600" : deadline.level === "warn" ? "text-amber-600" : "text-[#2563eb]"
                      }`} />
                      <span className="leading-relaxed">{deadline.message}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      <Calendar weight="duotone" />
                      Date de convocation
                    </label>
                    <Input type="date" id="date_convocation" name="date_convocation" className="rounded-xl h-11 focus-visible:ring-[#2563eb]" />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Calendar weight="duotone" />
                      Date d'audition
                    </label>
                    <Input type="date" id="date_audition" name="date_audition" className="rounded-xl h-11 focus-visible:ring-[#2563eb]" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── MOTIF ────────────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                Motif &amp; Description
              </div>

              <div>
                <label className={labelClass}>
                  <FileText weight="duotone" />
                  Motif / Description des faits *
                </label>
                <Textarea
                  id="motif"
                  name="motif"
                  required
                  minLength={10}
                  rows={4}
                  placeholder="Détaillez les faits reprochés (lieu, témoins, conséquences)…"
                  className="rounded-xl bg-white border-slate-200 min-h-[100px] focus-visible:ring-[#2563eb]"
                />
                <p className="mt-1.5 text-[11px] text-slate-500 leading-snug">
                  Le motif doit être précis et factuel. Une description vague rendrait la sanction attaquable pour défaut de cause réelle et sérieuse.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4 sticky bottom-0 bg-white -mx-8 px-8 mt-4 border-t border-slate-100 shrink-0 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-12 px-6 rounded-2xl border-slate-200 font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-6 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold shadow-lg shadow-[#2563eb]/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? "Création…" : "Initier la procédure"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
