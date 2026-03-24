"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  congeId: string;
}

export function CongesApprovalButton({ congeId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAction(statut: "approuve" | "refuse") {
    setLoading(true);
    const res = await fetch(`/api/conges/${congeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    toast.success(statut === "approuve" ? "Congé approuvé" : "Congé refusé");
    router.refresh();
  }

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        variant="outline"
        className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
        onClick={() => handleAction("approuve")}
        disabled={loading}
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Approuver
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => handleAction("refuse")}
        disabled={loading}
      >
        <XCircle className="h-3.5 w-3.5" />
        Refuser
      </Button>
    </div>
  );
}
