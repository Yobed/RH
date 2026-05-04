"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  header: string;
  badge: string;
}

const COLUMNS: Column[] = [
  { key: "nouveau",   label: "Nouveau",   bg: "bg-blue-950/30",   header: "border-blue-500/40",   badge: "bg-blue-500/20 text-blue-300" },
  { key: "en_cours",  label: "En cours",  bg: "bg-violet-950/30", header: "border-violet-500/40", badge: "bg-violet-500/20 text-violet-300" },
  { key: "shortlist", label: "Shortlist", bg: "bg-indigo-950/30", header: "border-indigo-500/40", badge: "bg-indigo-500/20 text-indigo-300" },
  { key: "entretien", label: "Entretien", bg: "bg-amber-950/30",  header: "border-amber-500/40",  badge: "bg-amber-500/20 text-amber-300" },
  { key: "offre",     label: "Offre",     bg: "bg-emerald-950/30",header: "border-emerald-500/40",badge: "bg-emerald-500/20 text-emerald-300" },
  { key: "embauche",  label: "Embauché",  bg: "bg-green-950/30",  header: "border-green-500/40",  badge: "bg-green-500/20 text-green-300" },
  { key: "refus",     label: "Refusé",    bg: "bg-rose-950/30",   header: "border-rose-500/40",   badge: "bg-rose-500/20 text-rose-300" },
];

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
  if (score >= 60) return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
  return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
}

interface CandidateCardProps {
  candidate: KanbanCandidate;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

function CandidateCard({ candidate, onDragStart }: CandidateCardProps) {
  const dateFormatted = (() => {
    try {
      return format(new Date(candidate.created_at), "d MMM yyyy", { locale: fr });
    } catch {
      return "";
    }
  })();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, candidate.id)}
      className="group cursor-grab active:cursor-grabbing rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 p-3 transition-all duration-150 select-none"
    >
      <p className="font-semibold text-[13px] text-white leading-tight truncate">{candidate.full_name}</p>
      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{candidate.poste_souhaite || "Poste non défini"}</p>
      <div className="flex items-center justify-between mt-2.5 gap-2">
        {candidate.score != null ? (
          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md ${scoreColor(candidate.score)}`}>
            {candidate.score}%
          </span>
        ) : (
          <span className="text-[10px] text-slate-600 font-mono">—</span>
        )}
        <span className="text-[10px] text-slate-600 shrink-0">{dateFormatted}</span>
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
      className={`flex flex-col min-w-56 w-56 rounded-2xl border transition-colors duration-150 ${
        isDragOver ? "border-white/30 bg-white/10" : `border-white/8 ${column.bg}`
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 border-b ${column.header}`}>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">{column.label}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${column.badge}`}>
          {candidates.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 min-h-24 flex-1">
        {candidates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-4">
            <p className="text-[10px] text-slate-700 text-center">Aucun candidat</p>
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
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
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
