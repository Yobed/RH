"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CaretDown, CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const STATUTS = [
  { value: "nouveau", label: "Nouveau" },
  { value: "en_cours", label: "En cours" },
  { value: "shortlist", label: "Shortlist" },
  { value: "entretien", label: "Entretien" },
  { value: "offre", label: "Offre" },
  { value: "embauche", label: "Embauché" },
  { value: "refus", label: "Refusé" },
];

interface Props {
  candidateId: string;
  currentStatut: string;
}

export function CandidateStatusSelect({ candidateId, currentStatut }: Props) {
  const [statut, setStatut] = useState(currentStatut);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(newStatut: string) {
    if (newStatut === statut) return;
    
    setStatut(newStatut);
    setLoading(true);

    try {
      const res = await fetch(`/api/recrutement/candidats/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });

      if (!res.ok) throw new Error();
      
      toast.success("Statut mis à jour", { 
        className: "rounded-2xl border-slate-100",
      });
      router.refresh();
    } catch (error) {
      toast.error("Erreur mise à jour statut");
      setStatut(currentStatut);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block w-full">
      <select
        value={statut}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className={cn(
          "w-full appearance-none rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-teal-300 focus:ring-4 focus:ring-teal-50/50 disabled:opacity-50 cursor-pointer",
          loading && "pr-8"
        )}
      >
        {STATUTS.map((s) => (
          <option key={s.value} value={s.value} className="bg-white text-slate-900 font-sans">
            {s.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
        {loading ? (
          <CircleNotch size={14} weight="bold" className="animate-spin" />
        ) : (
          <CaretDown size={14} weight="bold" />
        )}
      </div>
    </div>
  );
}
