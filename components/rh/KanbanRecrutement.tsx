"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { User, Sparkles, Calendar, Briefcase, CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";

export interface KanbanCandidate {
  id: string;
  full_name: string;
  poste_souhaite: string;
  score: number | null;
  statut: string;
  job_id: string | null;
  created_at: string;
}

type Statut =
  | "nouveau"
  | "en_cours"
  | "shortlist"
  | "entretien"
  | "offre"
  | "embauche"
  | "refus";

interface Column {
  key: Statut;
  label: string;
  bg: string;
  headerBorder: string;
  badge: string;
  accentColor: string;
}

const COLUMNS: Column[] = [
  { key: "nouveau",   label: "Nouveaux",   bg: "bg-slate-50/70 dark:bg-slate-900/40",     headerBorder: "border-[#f8d3a3] dark:border-[#ee7f03]/30",     badge: "bg-[#ee7f03]/15 text-[#d67002] dark:bg-[#ee7f03]/20 dark:text-[#f8d3a3]", accentColor: "bg-[#ee7f03]" },
  { key: "en_cours",  label: "En qualification",  bg: "bg-slate-50/70 dark:bg-slate-900/40", headerBorder: "border-slate-300 dark:border-slate-500/30", badge: "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300", accentColor: "bg-slate-500" },
  { key: "shortlist", label: "Shortlist", bg: "bg-slate-50/70 dark:bg-slate-900/40", headerBorder: "border-[#f8d3a3] dark:border-[#ee7f03]/30", badge: "bg-[#ee7f03]/15 text-[#d67002] dark:bg-[#ee7f03]/20 dark:text-[#f8d3a3]", accentColor: "bg-[#ee7f03]" },
  { key: "entretien", label: "Entretiens", bg: "bg-slate-50/70 dark:bg-slate-900/40",   headerBorder: "border-amber-300 dark:border-amber-500/30",   badge: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300", accentColor: "bg-[#ee7f03]" },
  { key: "offre",     label: "Offre émise",     bg: "bg-slate-50/70 dark:bg-slate-900/40",headerBorder: "border-emerald-300 dark:border-emerald-500/30",badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300", accentColor: "bg-emerald-500" },
  { key: "embauche",  label: "Embauchés",  bg: "bg-slate-50/70 dark:bg-slate-900/40",    headerBorder: "border-green-300 dark:border-green-500/30",   badge: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300", accentColor: "bg-green-600" },
  { key: "refus",     label: "Non retenus",    bg: "bg-slate-50/70 dark:bg-slate-900/40",      headerBorder: "border-rose-300 dark:border-rose-500/30",     badge: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300", accentColor: "bg-rose-500" },
];

function scoreBadge(score: number): string {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50";
  if (score >= 60) return "bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50";
  return "bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

interface CandidateCardProps {
  candidate: KanbanCandidate;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

function CandidateCard({ candidate, onDragStart }: CandidateCardProps) {
  const dateFormatted = (() => {
    try {
      return format(new Date(candidate.created_at), "d MMM", { locale: fr });
    } catch {
      return "";
    }
  })();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, candidate.id)}
      className="group cursor-grab active:cursor-grabbing rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:border-[#ee7f03]/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-[#ee7f03]/40 p-4 transition-all duration-250 select-none hover:-translate-y-1 relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-[#ee7f03] group-hover:text-white transition-colors">
            {getInitials(candidate.full_name)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate group-hover:text-[#ee7f03] transition-colors">{candidate.full_name}</p>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1">
              <Briefcase className="h-3 w-3 shrink-0" />
              {candidate.poste_souhaite || "Poste non défini"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 gap-2">
        {candidate.score != null ? (
          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 ${scoreBadge(candidate.score)}`}>
            <Sparkles className="h-3 w-3" />
            {candidate.score}% Match
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 dark:text-slate-600 font-medium">—</span>
        )}
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {dateFormatted}
        </span>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: Column;
  candidates: KanbanCandidate[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, targetStatut: Statut) => void;
}

function KanbanColumn({ column, candidates, onDragStart, onDrop }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    setIsDragOver(false);
    onDrop(e, column.key);
  }

  return (
    <div
      className={`flex flex-col min-w-[280px] w-[280px] rounded-3xl border transition-all duration-200 ${
        isDragOver
          ? "border-[#ee7f03] bg-[#ee7f03]/5 ring-2 ring-[#ee7f03]/20 scale-[1.01]"
          : `border-slate-200/80 dark:border-slate-800 ${column.bg}`
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 relative overflow-hidden rounded-t-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${column.accentColor}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">{column.label}</span>
        </div>
        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${column.badge}`}>
          {candidates.length}
        </span>
      </div>

      {/* Cards container */}
      <div className="flex flex-col gap-3 p-3 min-h-[350px] flex-1">
        {candidates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-slate-200/60 dark:border-slate-800 rounded-2xl my-2">
            <User className="h-6 w-6 text-slate-300 dark:text-slate-700 mb-1.5" />
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-600">Aucun candidat</p>
          </div>
        ) : (
          candidates.map((c) => (
            <CandidateCard key={c.id} candidate={c} onDragStart={onDragStart} />
          ))
        )}
      </div>
    </div>
  );
}

interface Props {
  candidates: KanbanCandidate[];
}

export function KanbanRecrutement({ candidates: initial }: Props) {
  const [candidates, setCandidates] = useState<KanbanCandidate[]>(initial);
  const draggingId = useRef<string | null>(null);

  function handleDragStart(e: React.DragEvent, id: string) {
    draggingId.current = id;
    e.dataTransfer.effectAllowed = "move";
  }

  async function handleDrop(e: React.DragEvent, targetStatut: Statut) {
    e.preventDefault();
    const id = draggingId.current;
    draggingId.current = null;
    if (!id) return;

    const candidate = candidates.find((c) => c.id === id);
    if (!candidate || candidate.statut === targetStatut) return;

    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, statut: targetStatut } : c))
    );

    try {
      const res = await fetch("/api/recrutement/update-statut", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut: targetStatut }),
      });

      if (!res.ok) throw new Error();
      toast.success("Statut mis à jour");
    } catch {
      // Rollback
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, statut: candidate.statut } : c))
      );
      toast.error("Erreur lors de la mise à jour du statut");
    }
  }

  const byStatut = (statut: Statut) => candidates.filter((c) => c.statut === statut);

  return (
    <div className="overflow-x-auto pb-6 pt-2 snap-x">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            column={col}
            candidates={byStatut(col.key)}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
