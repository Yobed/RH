"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  candidateId: string;
  hasScore: boolean;
}

export function ScoreCvButton({ candidateId, hasScore }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleScore() {
    setLoading(true);
    try {
      const res = await fetch("/api/recrutement/score-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur scoring IA");
        return;
      }

      const data = (await res.json()) as {
        score: { score_global: number; recommandation: string; justification: string };
      };

      const { score_global, recommandation, justification } = data.score;
      toast.success(
        `Score IA : ${score_global}/100 — ${recommandation.toUpperCase()}`,
        { description: justification, duration: 6000 }
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={hasScore ? "outline" : "default"}
      size="sm"
      onClick={handleScore}
      disabled={loading}
      className="gap-1.5"
    >
      <Sparkles className="h-3.5 w-3.5" />
      {loading ? "Analyse…" : hasScore ? "Re-scorer" : "Scorer IA"}
    </Button>
  );
}
