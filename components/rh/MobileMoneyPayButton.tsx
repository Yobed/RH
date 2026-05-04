"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DeviceMobile } from "@phosphor-icons/react";
import { detectProvider, PROVIDER_LABELS } from "@/lib/mobile-money";

interface Props {
  employeeId: string;
  bulletinId?: string;
  amount: number;
  phone?: string;
  employeeName: string;
}

export function MobileMoneyPayButton({ employeeId, bulletinId, amount, phone, employeeName }: Props) {
  const [state, setState] = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const [phoneInput, setPhoneInput] = useState(phone ?? "");

  const provider = detectProvider(phoneInput);
  const providerInfo = provider ? PROVIDER_LABELS[provider] : null;

  async function initiatePay() {
    if (!phoneInput || phoneInput.length < 8) {
      toast.error("Numéro de téléphone invalide");
      return;
    }
    if (!provider) {
      toast.error("Numéro non reconnu (Orange 07/08, Wave 01, MTN 05/06)");
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/paie/mobile-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, bulletinId, amount, phone: phoneInput }),
      });
      const data = await res.json() as { success?: boolean; reference?: string; error?: string };
      if (data.success) {
        setState("done");
        toast.success(`Paiement initié — Réf. ${data.reference ?? ""}`);
        setTimeout(() => setState("idle"), 4000);
      } else {
        throw new Error(data.error ?? "Échec paiement");
      }
    } catch (err) {
      setState("idle");
      toast.error(err instanceof Error ? err.message : "Erreur Mobile Money");
    }
  }

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-500/15 text-emerald-400">
        <DeviceMobile className="h-3.5 w-3.5" />
        Paiement envoyé ✓
      </span>
    );
  }

  if (state === "confirm") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="tel"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
          placeholder="07 XX XX XX"
          maxLength={10}
          className="w-32 rounded-lg border border-border bg-background px-2 py-1 text-xs font-mono"
        />
        {providerInfo && (
          <span className="text-xs font-medium" style={{ color: providerInfo.color }}>
            {providerInfo.label}
          </span>
        )}
        <button
          onClick={initiatePay}
          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
        >
          Confirmer
        </button>
        <button
          onClick={() => setState("idle")}
          className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-medium hover:bg-muted/70 transition-colors"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setState("confirm")}
      disabled={state === "loading"}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 disabled:opacity-60 transition-colors"
    >
      <DeviceMobile className="h-3.5 w-3.5" />
      {state === "loading" ? "Envoi…" : "Mobile Money"}
    </button>
  );
}
