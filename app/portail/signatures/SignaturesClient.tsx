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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  AlertCircle,
  Pen,
  Loader2,
} from "lucide-react";

interface SignatureRequest {
  id: string;
  doc_type: string;
  titre: string;
  description: string | null;
  document_url: string | null;
  reference: string | null;
  status: "en_attente" | "signe" | "refuse" | "expire";
  expire_le: string | null;
  created_at: string;
  signed_at: string | null;
  refused_at: string | null;
  refus_motif: string | null;
}

const docTypeLabels: Record<string, string> = {
  contrat: "Contrat",
  avenant: "Avenant",
  sanction: "Sanction",
  stc: "Solde de tout compte",
  reglement_interieur: "Règlement intérieur",
  autre: "Autre",
};

const statusConfig = {
  en_attente: { label: "En attente", icon: Clock, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  signe: { label: "Signé", icon: CheckCircle, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  refuse: { label: "Refusé", icon: XCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  expire: { label: "Expiré", icon: AlertCircle, bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-CI", { day: "2-digit", month: "long", year: "numeric" });
}

interface Props {
  requests: SignatureRequest[];
}

export function SignaturesClient({ requests: initial }: Props) {
  const [requests, setRequests] = useState(initial);
  const [selected, setSelected] = useState<SignatureRequest | null>(null);
  const [action, setAction] = useState<"signer" | "refuser" | null>(null);
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pending = requests.filter((r) => r.status === "en_attente");
  const done = requests.filter((r) => r.status !== "en_attente");

  async function handleAction() {
    if (!selected || !action) return;
    setLoading(true);
    setError("");

    try {
      const body = action === "signer" ? { action: "signer" } : { action: "refuser", motif };
      const res = await fetch(`/api/portail/signatures/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur");
        return;
      }
      // Mise à jour locale
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selected.id
            ? {
                ...r,
                status: json.status,
                signed_at: json.signed_at ?? r.signed_at,
                refused_at: json.refused_at ?? r.refused_at,
                refus_motif: action === "refuser" ? motif : r.refus_motif,
              }
            : r
        )
      );
      closeDialog();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  function openAction(req: SignatureRequest, a: "signer" | "refuser") {
    setSelected(req);
    setAction(a);
    setMotif("");
    setError("");
  }

  function closeDialog() {
    setSelected(null);
    setAction(null);
    setMotif("");
    setError("");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mes signatures</h1>
        <p className="text-sm text-slate-500 mt-1">Documents en attente de votre signature électronique.</p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600">
            En attente · {pending.length}
          </h2>
          <div className="space-y-3">
            {pending.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onSign={() => openAction(req, "signer")}
                onRefuse={() => openAction(req, "refuser")}
              />
            ))}
          </div>
        </section>
      )}

      {pending.length === 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-emerald-400 mb-3" />
          <p className="text-sm font-medium text-slate-700">Aucun document en attente</p>
          <p className="text-xs text-slate-500 mt-1">Vous n'avez aucune signature en suspens.</p>
        </div>
      )}

      {/* History */}
      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600">
            Historique · {done.length}
          </h2>
          <div className="space-y-2">
            {done.map((req) => {
              const cfg = statusConfig[req.status] ?? statusConfig.expire;
              const Icon = cfg.icon;
              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-100 bg-white p-4 flex items-start gap-4"
                >
                  <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                    <Icon className={`h-4 w-4 ${cfg.text}`} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{req.titre}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {docTypeLabels[req.doc_type] ?? req.doc_type}
                      {req.reference && ` · ${req.reference}`}
                    </p>
                    {req.status === "signe" && req.signed_at && (
                      <p className="text-xs text-emerald-600 mt-1">Signé le {fmtDate(req.signed_at)}</p>
                    )}
                    {req.status === "refuse" && req.refused_at && (
                      <p className="text-xs text-red-600 mt-1">
                        Refusé le {fmtDate(req.refused_at)}
                        {req.refus_motif && ` — ${req.refus_motif}`}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Dialog confirmation */}
      <Dialog open={!!selected && !!action} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          {action === "signer" && selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pen className="h-5 w-5 text-slate-700" />
                  Signer ce document
                </DialogTitle>
                <DialogDescription>
                  En cliquant sur "Confirmer ma signature", vous acceptez et signez électroniquement le document suivant.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
                <p className="text-sm font-semibold text-slate-900">{selected.titre}</p>
                <p className="text-xs text-slate-500">
                  {docTypeLabels[selected.doc_type] ?? selected.doc_type}
                  {selected.reference && ` · ${selected.reference}`}
                </p>
                {selected.description && (
                  <p className="text-xs text-slate-600 mt-2">{selected.description}</p>
                )}
                {selected.document_url && (
                  <a
                    href={selected.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Consulter le document
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Votre adresse IP, la date et l'heure seront horodatées comme preuve de signature.
              </p>
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={closeDialog} disabled={loading}>Annuler</Button>
                <Button onClick={handleAction} disabled={loading} className="gap-1.5">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pen className="h-4 w-4" />}
                  Confirmer ma signature
                </Button>
              </DialogFooter>
            </>
          )}

          {action === "refuser" && selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  Refuser ce document
                </DialogTitle>
                <DialogDescription>
                  Indiquez le motif de votre refus pour <strong>{selected.titre}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="motif" className="text-sm">Motif du refus <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="motif"
                    placeholder="Expliquez pourquoi vous refusez ce document…"
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={closeDialog} disabled={loading}>Annuler</Button>
                <Button
                  variant="destructive"
                  onClick={handleAction}
                  disabled={loading || motif.trim().length < 2}
                  className="gap-1.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Confirmer le refus
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestCard({
  req,
  onSign,
  onRefuse,
}: {
  req: SignatureRequest;
  onSign: () => void;
  onRefuse: () => void;
}) {
  const isExpired = req.expire_le && new Date(req.expire_le) < new Date();

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <FileText className="h-4.5 w-4.5 text-amber-700" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{req.titre}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {docTypeLabels[req.doc_type] ?? req.doc_type}
              {req.reference && ` · Réf. ${req.reference}`}
            </p>
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </span>
      </div>

      {req.description && (
        <p className="text-sm text-slate-700 bg-white rounded-lg px-3 py-2 border border-slate-100">
          {req.description}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] text-slate-500">
            Reçu le {fmtDate(req.created_at)}
          </p>
          {req.expire_le && (
            <p className={`text-[11px] font-medium ${isExpired ? "text-red-600" : "text-amber-700"}`}>
              {isExpired ? "Expiré le" : "Expire le"} {fmtDate(req.expire_le)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {req.document_url && (
            <a
              href={req.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Consulter
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50"
            onClick={onRefuse}
            disabled={!!isExpired}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Refuser
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={onSign}
            disabled={!!isExpired}
          >
            <Pen className="h-3.5 w-3.5" />
            Signer
          </Button>
        </div>
      </div>
    </div>
  );
}
