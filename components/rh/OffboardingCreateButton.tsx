"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  employeeId: string;
  defaultDateSortie: string | null;
  ruptureId: string | null;
}

export function OffboardingCreateButton({ employeeId, defaultDateSortie, ruptureId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dateSortie, setDateSortie] = useState<string>(
    defaultDateSortie ?? new Date().toISOString().slice(0, 10)
  );

  function handleCreate() {
    startTransition(async () => {
      const res = await fetch(`/api/offboarding/${employeeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_sortie_prevue: dateSortie,
          rupture_id: ruptureId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error ?? "Erreur lors de la création");
        return;
      }
      toast.success("Checklist créée");
      router.refresh();
    });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Input
        type="date"
        value={dateSortie}
        onChange={(e) => setDateSortie(e.target.value)}
        className="w-[160px] text-sm"
      />
      <Button onClick={handleCreate} disabled={isPending} size="sm">
        <Plus className="mr-1 h-3.5 w-3.5" weight="bold" />
        {isPending ? "Création…" : "Créer la checklist"}
      </Button>
    </div>
  );
}
