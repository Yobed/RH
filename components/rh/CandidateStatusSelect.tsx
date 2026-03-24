"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STATUTS = [
  { value: "nouveau", label: "Nouveau" },
  { value: "en_cours", label: "En cours" },
  { value: "shortlist", label: "Shortlist" },
  { value: "entretien", label: "Entretien" },
  { value: "offre", label: "Offre" },
  { value: "embauche", label: "Embauché" },
  { value: "refus", label: "Refusé" },
];

const selectClass =
  "rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

interface Props {
  candidateId: string;
  currentStatut: string;
}

export function CandidateStatusSelect({ candidateId, currentStatut }: Props) {
  const [statut, setStatut] = useState(currentStatut);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatut = e.target.value;
    setStatut(newStatut);
    setLoading(true);

    const res = await fetch(`/api/recrutement/candidats/${candidateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: newStatut }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Erreur mise à jour statut");
      setStatut(currentStatut);
      return;
    }
    router.refresh();
  }

  return (
    <select
      value={statut}
      onChange={handleChange}
      disabled={loading}
      className={selectClass}
    >
      {STATUTS.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
