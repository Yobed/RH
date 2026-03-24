"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  caseId: string;
  reference: string;
}

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function CloseLegalCaseButton({ caseId, reference }: Props) {
  const [open, setOpen] = useState(false);
  const [statut, setStatut] = useState<"résolu" | "classé" | "en_appel">("résolu");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClose() {
    setLoading(true);
    try {
      const res = await fetch(`/api/legal-cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur serveur");
        return;
      }

      toast.success(`Dossier ${reference} — ${statut}`);
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <CheckCircle className="h-3.5 w-3.5" />
        Clôturer
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Clôturer le dossier</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <span className="font-mono text-muted-foreground">{reference}</span>
          </div>

          <div>
            <label className="text-sm font-medium">Issue du dossier</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as "résolu" | "classé" | "en_appel")}
              className={`mt-1 ${selectClass}`}
            >
              <option value="résolu">Résolu — accord ou décision finale</option>
              <option value="classé">Classé sans suite</option>
              <option value="en_appel">En appel</option>
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            Cette action change le statut du dossier. Elle peut être modifiée ultérieurement.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleClose} disabled={loading}>
            {loading ? "Enregistrement..." : "Confirmer la clôture"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
