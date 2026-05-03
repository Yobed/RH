"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface InviterPortailButtonProps {
  employeeId: string;
  employeeName: string;
  employeeEmail: string | null | undefined;
}

export function InviterPortailButton({ employeeId, employeeName, employeeEmail }: InviterPortailButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleInvite() {
    setStatus("loading");
    try {
      const res = await fetch(`/api/employees/${employeeId}/inviter-portail`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "Erreur lors de l'invitation");
      } else {
        setStatus("success");
        setMessage(json.message ?? "Invitation envoyée");
      }
    } catch {
      setStatus("error");
      setMessage("Erreur réseau");
    }
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => setStatus("idle"), 300);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <Send className="h-3.5 w-3.5" />
          Inviter au portail
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter au portail salarié</DialogTitle>
          <DialogDescription>
            Crée un accès au portail self-service pour{" "}
            <strong>{employeeName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {status === "idle" && (
          <div className="space-y-3 py-2">
            {employeeEmail ? (
              <p className="text-sm text-slate-600">
                Un email de connexion sera envoyé à{" "}
                <span className="font-medium text-slate-900">{employeeEmail}</span>.
                Le salarié pourra définir son mot de passe via le lien reçu.
              </p>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  Cet employé n'a pas d'email renseigné. Ajoutez un email dans sa fiche avant d'envoyer l'invitation.
                </p>
              </div>
            )}
          </div>
        )}

        {status === "loading" && (
          <div className="flex items-center justify-center py-8 gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Création du compte en cours…</span>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Invitation envoyée</p>
              <p className="text-sm text-emerald-700 mt-0.5">{message}</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Échec de l'invitation</p>
              <p className="text-sm text-red-700 mt-0.5">{message}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {status === "idle" && (
            <>
              <Button variant="ghost" onClick={handleClose}>Annuler</Button>
              <Button
                onClick={handleInvite}
                disabled={!employeeEmail}
                className="gap-1.5"
              >
                <Send className="h-4 w-4" />
                Envoyer l'invitation
              </Button>
            </>
          )}
          {(status === "success" || status === "error") && (
            <Button onClick={handleClose}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
