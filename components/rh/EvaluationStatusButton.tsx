"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, Play } from "lucide-react";

interface Props {
  id: string;
  statut: string;
}

export function EvaluationStatusButton({ id, statut }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function updateStatut(newStatut: string) {
    setLoading(true);
    const res = await fetch(`/api/evaluations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: newStatut }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    toast.success("Statut mis à jour");
    router.refresh();
  }

  if (statut === "TERMINEE" || statut === "ANNULEE") {
    return (
      <button
        onClick={() => updateStatut("EN_COURS")}
        disabled={loading}
        title="Rouvrir l'évaluation"
        className="flex items-center gap-1 rounded-md border border-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 mx-auto"
      >
        <RotateCcw className="h-3 w-3" />
        Rouvrir
      </button>
    );
  }

  if (statut === "PLANIFIEE") {
    return (
      <button
        onClick={() => updateStatut("EN_COURS")}
        disabled={loading}
        title="Démarrer l'évaluation"
        className="flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 mx-auto"
      >
        <Play className="h-3 w-3" />
        Démarrer
      </button>
    );
  }

  return (
    <button
      onClick={() => updateStatut("TERMINEE")}
      disabled={loading}
      title="Clôturer l'évaluation"
      className="flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 mx-auto"
    >
      <CheckCircle2 className="h-3 w-3" />
      Clôturer
    </button>
  );
}
