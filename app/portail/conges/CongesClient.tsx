"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, CalendarDays, Check, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { PortailHeader } from "../PortailHeader";

interface Conge {
  id: string;
  type: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  statut: string;
  commentaire: string | null;
  refus_motif: string | null;
  created_at: string | null;
}

interface Solde {
  joursAcquis: number;
  joursPris: number;
  solde: number;
  annee: number;
}

interface Props {
  conges: Conge[];
  solde: Solde;
}

const TYPE_LABELS: Record<string, string> = {
  annuel: "Congé annuel",
  maladie: "Maladie",
  maternite: "Maternité",
  paternite: "Paternité",
  sans_solde: "Sans solde",
  exceptionnel: "Exceptionnel",
};

const STATUT_STYLES: Record<string, { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }> = {
  en_attente: { label: "En attente", tone: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20", icon: Clock },
  soumis: { label: "Soumis", tone: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20", icon: Clock },
  approuve: { label: "Approuvé", tone: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20", icon: Check },
  refuse: { label: "Refusé", tone: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20", icon: XCircle },
};

export function CongesClient({ conges, solde }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <PortailHeader
        title="Mes congés"
        subtitle="Demande de congés et suivi des validations."
        icon={CalendarDays}
        action={
          <button
            onClick={() => setCreating(true)}
            className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-[#ee7f03] px-4 text-sm font-medium text-white transition-colors hover:bg-[#d67002]"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouvelle demande
          </button>
        }
      />

      {/* Solde */}
      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Acquis {solde.annee}</p>
            <p className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-1">{solde.joursAcquis.toFixed(1)} j</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Pris</p>
            <p className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-1">{solde.joursPris.toFixed(1)} j</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-medium">Solde</p>
            <p className="text-lg sm:text-2xl font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">{solde.solde.toFixed(1)} j</p>
          </div>
        </div>
      </section>

      {/* Historique */}
      {conges.length === 0 ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-12 text-center">
          <CalendarDays className="h-7 w-7 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Aucune demande</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Faites votre première demande de congé.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conges.map((c) => {
            const sev = STATUT_STYLES[c.statut] ?? STATUT_STYLES.en_attente;
            const Icon = sev.icon;
            return (
              <li key={c.id} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{TYPE_LABELS[c.type] ?? c.type}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                      Du {format(parseISO(c.date_debut), "d MMM", { locale: fr })}{" "}
                      au {format(parseISO(c.date_fin), "d MMM yyyy", { locale: fr })} · {c.nb_jours} j
                    </p>
                    {c.commentaire && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 italic">{c.commentaire}</p>
                    )}
                    {c.statut === "refuse" && c.refus_motif && (
                      <p className="text-xs text-rose-700 dark:text-rose-400 mt-2">Motif refus : {c.refus_motif}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${sev.tone} shrink-0`}>
                    <Icon className="h-3 w-3" />
                    {sev.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating && (
        <CreateLeaveDialog
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            router.refresh();
          }}
          maxSolde={solde.solde}
        />
      )}
    </div>
  );
}

function CreateLeaveDialog({
  onClose, onCreated, maxSolde,
}: {
  onClose: () => void;
  onCreated: () => void;
  maxSolde: number;
}) {
  const [type, setType] = useState("annuel");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nbJours = (() => {
    if (!debut || !fin) return 0;
    const d1 = new Date(debut);
    const d2 = new Date(fin);
    if (d2 < d1) return 0;
    return Math.ceil((d2.getTime() - d1.getTime()) / 86_400_000) + 1;
  })();

  const tooMany = type === "annuel" && nbJours > maxSolde;

  async function handleSubmit(): Promise<void> {
    if (!debut || !fin || nbJours <= 0) {
      toast.error("Renseignez des dates valides.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/portail/conges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          date_debut: debut,
          date_fin: fin,
          nb_jours: nbJours,
          commentaire: commentaire || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur");
        return;
      }
      toast.success("Demande envoyée — en attente de validation RH");
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col border border-transparent dark:border-slate-800">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Nouvelle demande de congé</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1 -m-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-slate-100"
            >
              <option value="annuel">Congé annuel</option>
              <option value="maladie">Maladie</option>
              <option value="maternite">Maternité</option>
              <option value="paternite">Paternité</option>
              <option value="sans_solde">Sans solde</option>
              <option value="exceptionnel">Exceptionnel</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Du *</label>
              <input
                type="date"
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Au *</label>
              <input
                type="date"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                min={debut}
                className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-slate-100"
              />
            </div>
          </div>
          {nbJours > 0 && (
            <div className={`rounded-md border p-3 text-xs ${tooMany ? "border-rose-200 dark:border-rose-500/20 bg-rose-50/60 dark:bg-rose-500/10 text-rose-900 dark:text-rose-400" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
              <p>
                <span className="font-semibold">{nbJours} jour(s)</span> demandé(s)
                {type === "annuel" && (
                  <>
                    {" · "}solde restant après : <span className="tabular-nums">{(maxSolde - nbJours).toFixed(1)} j</span>
                  </>
                )}
              </p>
              {tooMany && (
                <p className="mt-1">⚠ La demande dépasse votre solde disponible.</p>
              )}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Commentaire</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              placeholder="Motif ou précision (facultatif)"
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm dark:text-slate-100"
            />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || nbJours <= 0}
            className="flex-1 h-9 px-4 rounded-md bg-slate-900 dark:bg-slate-100 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50"
          >
            {submitting ? "Envoi…" : "Soumettre"}
          </button>
        </div>
      </div>
    </div>
  );
}
