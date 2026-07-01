import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge — badge de statut UNIFIÉ pour toute l'app.
// Mappe un statut RH (français) à un « ton » sémantique cohérent, pour que le
// même statut ait toujours la même couleur partout (réduit la charge mentale).
// Usage : <StatusBadge status="approuvé" />  ou  <StatusBadge tone="success" label="Payé" />
// ─────────────────────────────────────────────────────────────────────────────

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  info: "bg-[#ee7f03]/10 text-[#ee7f03] dark:bg-[#ee7f03]/10 dark:text-[#f8d3a3]",
  neutral: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-[#ee7f03]",
  neutral: "bg-slate-400",
};

// Mappe les statuts RH courants vers un ton. Clé = statut normalisé (minuscules,
// espaces/tirets → underscore, accents conservés et variantes ajoutées).
const STATUS_TONE: Record<string, StatusTone> = {
  // ✅ Succès / positif
  actif: "success", active: "success", approuve: "success", "approuvé": "success",
  valide: "success", "validé": "success", termine: "success", "terminé": "success",
  signe: "success", "signé": "success", paye: "success", "payé": "success",
  cloture: "success", "clôturé": "success", complete: "success", "complété": "success",
  embauche: "success", "embauché": "success", shortlist: "success", apte: "success",
  // ⏳ En cours / attente
  demande: "warning", en_attente: "warning", attente: "warning", brouillon: "warning",
  en_cours: "warning", notifie: "warning", "notifié": "warning", suspendu: "warning",
  provisoire: "warning", a_valider: "warning", entretien: "warning", planifie: "warning", "planifié": "warning",
  valide_manager: "warning", valide_rh: "warning", soumis: "warning",
  // ⛔ Négatif / risque
  refuse: "danger", "refusé": "danger", inactif: "danger", expire: "danger", "expiré": "danger",
  rejete: "danger", "rejeté": "danger", annule: "danger", "annulé": "danger",
  retard: "danger", en_retard: "danger", licencie: "danger", "licencié": "danger",
  rupture: "danger", inapte: "danger", refus: "danger",
  // ℹ️ Information / neutre actif
  ouvert: "info", nouveau: "info", en_revision: "info", "en_révision": "info",
};

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

function humanize(value: string): string {
  const s = value.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface StatusBadgeProps {
  /** Statut brut (ex. "approuvé", "en_attente") — détermine le ton automatiquement */
  status?: string;
  /** Force le ton (sinon déduit du statut) */
  tone?: StatusTone;
  /** Texte affiché (sinon le statut humanisé) */
  label?: string;
  /** Masquer la pastille de couleur */
  hideDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, tone, label, hideDot, className }: StatusBadgeProps) {
  const key = status ? normalize(status) : "";
  const resolvedTone: StatusTone =
    tone ?? STATUS_TONE[key] ?? (status ? STATUS_TONE[status.toLowerCase()] : undefined) ?? "neutral";
  const text = label ?? (status ? humanize(status) : "—");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[resolvedTone],
        className
      )}
    >
      {!hideDot && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_CLASSES[resolvedTone])} aria-hidden />}
      {text}
    </span>
  );
}
