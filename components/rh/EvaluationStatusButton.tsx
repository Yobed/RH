"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw } from "lucide-react";

interface Props {
  id: string;
  statut: string;
}

export function EvaluationStatusButton({ id, statut }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    const newStatut = statut === "brouillon" ? "validé" : "brouillon";
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

    toast.success(newStatut === "validé" ? "Évaluation validée" : "Remise en brouillon");
    router.refresh();
  }

  if (statut === "validé") {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        title="Remettre en brouillon"
        className="flex items-center gap-1 rounded-md border border-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        <RotateCcw className="h-3 w-3" />
        Brouillon
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title="Valider l'évaluation"
      className="flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
    >
      <CheckCircle2 className="h-3 w-3" />
      Valider
    </button>
  );
}
