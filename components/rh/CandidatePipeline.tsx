"use client";

import { motion } from "framer-motion";
import { CandidateStatusSelect } from "./CandidateStatusSelect";
import { User, Briefcase, Star, Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const STATUTS = [
  { id: "nouveau", label: "Nouveau", color: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-600" },
  { id: "en_cours", label: "En cours", color: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
  { id: "shortlist", label: "Shortlist", color: "bg-sky-500", bg: "bg-sky-50", text: "text-sky-700" },
  { id: "entretien", label: "Entretien", color: "bg-slate-500", bg: "bg-slate-50", text: "text-slate-700" },
  { id: "offre", label: "Offre", color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  { id: "embauche", label: "Embauché", color: "bg-green-500", bg: "bg-green-50", text: "text-green-700" },
  { id: "refus", label: "Refusé", color: "bg-red-400", bg: "bg-red-50", text: "text-red-700" },
];

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  score_ia: number | null;
  statut: string;
  job_title: string;
}

interface Props {
  candidates: Candidate[];
}

export function CandidatePipeline({ candidates }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 min-h-[600px] scrollbar-hide">
      {STATUTS.map((column) => {
        const columnCandidates = candidates.filter((c) => (c.statut || "nouveau") === column.id);
        
        return (
          <div key={column.id} className="flex flex-col min-w-[280px] w-[280px] shrink-0">
            {/* Column Header */}
            <div className="mb-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", column.color)} />
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">{column.label}</h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-mono">
                  {columnCandidates.length}
                </span>
              </div>
            </div>

            {/* Column Body */}
            <div className="flex-1 rounded-2xl bg-slate-50/50 border border-slate-100/80 p-2 space-y-3">
              {columnCandidates.map((c, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative rounded-xl bg-white p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)] hover:border-teal-100 transition-all cursor-default"
                >
                  {/* Score IA Badge */}
                  {c.score_ia != null && (
                    <div className={cn(
                      "absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-lg font-mono",
                      c.score_ia >= 80 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      c.score_ia >= 60 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      "bg-rose-50 text-rose-600 border border-rose-100"
                    )}>
                      {c.score_ia}%
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                      <User size={16} weight="bold" className="text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate leading-tight">{c.full_name}</h4>
                      <p className="text-[10px] text-slate-500 truncate">{c.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-slate-600 bg-slate-50 rounded-lg px-2 py-1.5">
                    <Briefcase size={12} weight="bold" />
                    <span className="text-[11px] font-medium truncate">{c.job_title}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-50">
                    <CandidateStatusSelect 
                      candidateId={c.id} 
                      currentStatut={c.statut || "nouveau"} 
                    />
                  </div>
                </motion.div>
              ))}

              {columnCandidates.length === 0 && (
                <div className="h-24 flex items-center justify-center rounded-xl border border-dashed border-slate-200 opacity-50">
                  <span className="text-[10px] text-slate-400 font-medium">Vide</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
