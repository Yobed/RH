"use client";

import { useState, useEffect, useCallback } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import {
  ShieldCheck,
  ShieldWarning,
  QrCode,
  CheckCircle,
  WarningCircle,
  Lock,
  LockOpen,
} from "@phosphor-icons/react";
import Image from "next/image";

type MfaState = "loading" | "inactive" | "enrolling" | "verifying" | "active";

type EnrollData = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export function MfaSetup() {
  const [mfaState, setMfaState] = useState<MfaState>("loading");
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeFactorId, setActiveFactorId] = useState<string | null>(null);

  const checkMfaStatus = useCallback(async () => {
    const supabase = createClientSupabase();
    const { data, error: listError } = await supabase.auth.mfa.listFactors();

    if (listError) {
      setMfaState("inactive");
      return;
    }

    const verifiedFactor = data?.totp?.find((f) => f.status === "verified");
    if (verifiedFactor) {
      setActiveFactorId(verifiedFactor.id);
      setMfaState("active");
    } else {
      setMfaState("inactive");
    }
  }, []);

  useEffect(() => {
    checkMfaStatus();
  }, [checkMfaStatus]);

  const handleEnroll = useCallback(async () => {
    setError(null);
    setMfaState("enrolling");

    const supabase = createClientSupabase();
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "RH Manager CI",
    });

    if (enrollError || !data) {
      setError(enrollError?.message ?? "Erreur lors de l'activation du 2FA");
      setMfaState("inactive");
      return;
    }

    setEnrollData({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
    setMfaState("verifying");
  }, []);

  const handleVerify = useCallback(async () => {
    if (!enrollData || code.length !== 6) return;
    setError(null);

    const supabase = createClientSupabase();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollData.factorId,
      code,
    });

    if (verifyError) {
      setError("Code incorrect. Vérifiez votre application authenticator.");
      return;
    }

    setActiveFactorId(enrollData.factorId);
    setEnrollData(null);
    setCode("");
    setMfaState("active");
  }, [enrollData, code]);

  const handleDisable = useCallback(async () => {
    if (!activeFactorId) return;
    setError(null);

    const supabase = createClientSupabase();
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: activeFactorId,
    });

    if (unenrollError) {
      setError(unenrollError.message);
      return;
    }

    setActiveFactorId(null);
    setMfaState("inactive");
  }, [activeFactorId]);

  if (mfaState === "loading") {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="h-5 w-5 rounded-full border-2 border-[#f6c68a] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statut */}
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          mfaState === "active"
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
            : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
        }`}
      >
        {mfaState === "active" ? (
          <>
            <ShieldCheck weight="fill" className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Double authentification activée
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-500">
                Votre compte est protégé par une authentification TOTP
              </p>
            </div>
          </>
        ) : (
          <>
            <ShieldWarning weight="fill" className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Double authentification non activée
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-500">
                Activez le 2FA pour sécuriser votre compte
              </p>
            </div>
          </>
        )}
      </div>

      {/* État inactif */}
      {mfaState === "inactive" && (
        <button
          onClick={handleEnroll}
          className="flex items-center gap-2 rounded-xl bg-[#ee7f03] hover:bg-[#ee7f03] text-white px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          <Lock weight="bold" className="h-4 w-4" />
          Activer la double authentification
        </button>
      )}

      {/* État QR code affiché */}
      {mfaState === "verifying" && enrollData && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <QrCode weight="duotone" className="h-5 w-5 shrink-0 text-[#ee7f03] mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Étape 1 — Scannez le QR code
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Utilisez Google Authenticator, Authy ou tout autre app TOTP
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={enrollData.qrCode}
                  alt="QR code 2FA"
                  width={160}
                  height={160}
                  className="rounded"
                />
              </div>
              <details className="text-center">
                <summary className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                  Saisir le code manuellement
                </summary>
                <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg break-all">
                  {enrollData.secret}
                </p>
              </details>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Étape 2 — Entrez le code à 6 chiffres
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-center text-2xl font-mono tracking-widest text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#f8d3a3] dark:focus:ring-[#ee7f03]"
            />
            <button
              onClick={handleVerify}
              disabled={code.length !== 6}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#ee7f03] hover:bg-[#ee7f03] disabled:opacity-50 text-white px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <CheckCircle weight="bold" className="h-4 w-4" />
              Vérifier et activer
            </button>
          </div>
        </div>
      )}

      {/* État actif */}
      {mfaState === "active" && (
        <button
          onClick={handleDisable}
          className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          <LockOpen weight="bold" className="h-4 w-4" />
          Désactiver le 2FA
        </button>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2.5">
          <WarningCircle weight="fill" className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-[12.5px] text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
