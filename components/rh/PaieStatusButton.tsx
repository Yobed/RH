"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const NEXT_STATUT: Record<string, { label: string; next: string }> = {
  brouillon: { label: "Valider", next: "validé" },
  validé: { label: "Marquer payé", next: "payé" },
  payé: { label: "Payé ✓", next: "payé" },
};

const selectClass =
  "rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

interface Props {
  bulletinId: string;
  currentStatut: string;
}

export function PaieStatusButton({ bulletinId, currentStatut }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const config = NEXT_STATUT[currentStatut];

  if (!config || currentStatut === "payé") {
    return <span className="text-xs text-emerald-600 font-medium">Payé ✓</span>;
  }

  async function handleClick() {
    setLoading(true);
    const res = await fetch(`/api/paie/${bulletinId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: config.next }),
    });
    setLoading(false);
    if (!res.ok) { toast.error("Erreur mise à jour"); return; }
    toast.success(`Bulletin ${config.next}`);
    router.refresh();
  }

  return (
    <button onClick={handleClick} disabled={loading} className={selectClass}>
      {loading ? "…" : config.label}
    </button>
  );
}
