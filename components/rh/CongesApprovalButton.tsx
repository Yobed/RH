"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  congeId: string;
  statut: string;
  canManagerApprove: boolean;
  canRhApprove: boolean;
}

export function CongesApprovalButton({
  congeId,
  statut,
  canManagerApprove,
  canRhApprove,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [refusDialogOpen, setRefusDialogOpen] = useState(false);
  const [motif, setMotif] = useState("");
  const router = useRouter();

  async function handleAction(
    action: "valider_manager" | "valider_rh" | "refuser",
    refusMotif?: string
  ) {
    setLoading(true);
    const res = await fetch(`/api/conges/${congeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, motif: refusMotif }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(
        (data as { error?: string }).error ?? "Erreur lors de la mise a jour"
      );
      return;
    }

    if (action === "valider_manager") {
      toast.success("Valide par le manager");
    } else if (action === "valider_rh") {
      toast.success("Conge approuve — solde mis a jour");
    } else {
      toast.success("Conge refuse");
    }

    router.refresh();
  }

  async function handleRefus() {
    await handleAction("refuser", motif || undefined);
    setRefusDialogOpen(false);
    setMotif("");
  }

  // Statuts terminaux — afficher un badge uniquement
  if (statut === "approuve") {
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
        <CheckCheck className="h-3 w-3" />
        Approuve
      </Badge>
    );
  }

  if (statut === "refuse") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Refuse
      </Badge>
    );
  }

  const canRefuse = statut === "en_attente" || statut === "valide_manager";

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {statut === "en_attente" && canManagerApprove && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-[#ee7f03] border-[#ee7f03]/30 hover:bg-[#ee7f03]/10"
            onClick={() => handleAction("valider_manager")}
            disabled={loading}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Valider (Manager)
          </Button>
        )}

        {statut === "valide_manager" && canRhApprove && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={() => handleAction("valider_rh")}
            disabled={loading}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Approuver (RH)
          </Button>
        )}

        {statut === "en_attente" && !canManagerApprove && (
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200">
            <Clock className="h-3 w-3" />
            En attente manager
          </Badge>
        )}

        {statut === "valide_manager" && !canRhApprove && (
          <Badge variant="outline" className="gap-1 text-[#ee7f03] border-[#ee7f03]/30">
            <Clock className="h-3 w-3" />
            En attente RH
          </Badge>
        )}

        {canRefuse && (canManagerApprove || canRhApprove) && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setRefusDialogOpen(true)}
            disabled={loading}
          >
            <XCircle className="h-3.5 w-3.5" />
            Refuser
          </Button>
        )}
      </div>

      <Dialog open={refusDialogOpen} onOpenChange={setRefusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motif du refus</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Motif de refus (optionnel)"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRefusDialogOpen(false);
                setMotif("");
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefus}
              disabled={loading}
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
