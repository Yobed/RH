"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkle, CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        { 
          description: justification, 
          duration: 6000,
          className: "rounded-2xl border-slate-100",
        }
      );
      router.refresh();
    } catch (error) {
      toast.error("Une erreur s'est produite lors du scoring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleScore}
      disabled={loading}
      className={cn(
        "h-8 px-3 gap-2 rounded-full transition-all duration-300",
        hasScore 
          ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100" 
          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 ring-1 ring-indigo-200/50"
      )}
    >
      {loading ? (
        <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" />
      ) : (
        <Sparkle className="h-3.5 w-3.5" weight={hasScore ? "regular" : "fill"} />
      )}
      <span className="text-[11px] font-bold uppercase tracking-wider">
        {loading ? "Analyse…" : hasScore ? "Re-scorer" : "Scorer IA"}
      </span>
    </Button>
  );
}
