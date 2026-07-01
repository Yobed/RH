"use client";

import { useState, useRef, useTransition } from "react";

interface BrandingFormProps {
  logoUrl: string | null;
  couleurPrimaire: string;
  couleurSecondaire: string;
}

export function BrandingForm({
  logoUrl,
  couleurPrimaire,
  couleurSecondaire,
}: BrandingFormProps) {
  const [primary, setPrimary] = useState(couleurPrimaire);
  const [secondary, setSecondary] = useState(couleurSecondaire);
  const [previewLogo, setPreviewLogo] = useState<string | null>(logoUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewLogo(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    setErrorMsg(null);
    setSaved(false);

    startTransition(async () => {
      try {
        let finalLogoUrl = logoUrl;

        if (pendingFile) {
          const fd = new FormData();
          fd.append("file", pendingFile);
          const uploadRes = await fetch("/api/company/branding", {
            method: "POST",
            body: fd,
          });
          const uploadJson: unknown = await uploadRes.json();
          if (
            !uploadRes.ok ||
            typeof uploadJson !== "object" ||
            uploadJson === null ||
            !("logo_url" in uploadJson)
          ) {
            const msg =
              typeof uploadJson === "object" &&
              uploadJson !== null &&
              "error" in uploadJson &&
              typeof (uploadJson as Record<string, unknown>).error === "string"
                ? (uploadJson as Record<string, string>).error
                : "Erreur lors de l'upload du logo";
            setErrorMsg(msg);
            return;
          }
          finalLogoUrl = (uploadJson as Record<string, string>).logo_url;
        }

        const patchRes = await fetch("/api/company/branding", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logo_url: finalLogoUrl,
            couleur_primaire: primary,
            couleur_secondaire: secondary,
          }),
        });

        if (!patchRes.ok) {
          const patchJson: unknown = await patchRes.json();
          const msg =
            typeof patchJson === "object" &&
            patchJson !== null &&
            "error" in patchJson &&
            typeof (patchJson as Record<string, unknown>).error === "string"
              ? (patchJson as Record<string, string>).error
              : "Erreur lors de la sauvegarde";
          setErrorMsg(msg);
          return;
        }

        setPendingFile(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setErrorMsg("Une erreur inattendue est survenue");
      }
    });
  }

  return (
    <div className="pro-card p-6 space-y-6">
      {/* En-tête section */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ee7f03]/10 border border-[#ee7f03]/20 dark:bg-[#b35c00]/30 dark:border-[#d67002]">
          <svg className="h-5 w-5 text-[#ee7f03] dark:text-[#f6c68a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Identité visuelle</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Logo et couleurs de votre interface</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Colonne gauche — formulaire */}
        <div className="space-y-5">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Logo de la société
            </label>
            <div className="flex items-center gap-4">
              {previewLogo ? (
                <img
                  src={previewLogo}
                  alt="Logo"
                  className="h-14 w-14 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800"
                />
              ) : (
                <div className="h-14 w-14 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center dark:border-slate-600 dark:bg-slate-800">
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-[#ee7f03] hover:text-[#ee7f03] dark:text-[#f6c68a] dark:hover:text-[#f8d3a3]"
                >
                  {previewLogo ? "Changer le logo" : "Choisir un logo"}
                </button>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">PNG, JPG, SVG — max 2 Mo</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          {/* Couleur primaire */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Couleur primaire
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="h-10 w-10 rounded-lg border border-slate-200 cursor-pointer dark:border-slate-700"
              />
              <input
                type="text"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ee7f03] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                maxLength={7}
                pattern="#[0-9a-fA-F]{6}"
              />
            </div>
          </div>

          {/* Couleur secondaire */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Couleur secondaire
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="h-10 w-10 rounded-lg border border-slate-200 cursor-pointer dark:border-slate-700"
              />
              <input
                type="text"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ee7f03] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                maxLength={7}
                pattern="#[0-9a-fA-F]{6}"
              />
            </div>
          </div>
        </div>

        {/* Colonne droite — aperçu sidebar */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Aperçu sidebar</p>
          <div
            className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm"
            style={{ background: primary }}
          >
            {/* Header sidebar preview */}
            <div className="flex items-center gap-2 px-3 py-3 border-b" style={{ borderColor: `${secondary}55` }}>
              {previewLogo ? (
                <img src={previewLogo} alt="Logo" className="h-7 w-7 rounded-lg object-contain bg-white/20 p-0.5" />
              ) : (
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: secondary }}>
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  </svg>
                </div>
              )}
              <span className="text-[12px] font-bold text-white">RH Manager CI</span>
            </div>

            {/* Nav items preview */}
            <div className="px-2 py-2 space-y-0.5">
              {["Tableau de bord", "Employés", "Paie", "Congés", "Documents"].map((item, i) => (
                <div
                  key={item}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                  style={
                    i === 0
                      ? { background: secondary, color: "white" }
                      : { color: "rgba(255,255,255,0.7)" }
                  }
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback + bouton */}
      {errorMsg && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ee7f03] text-white text-sm font-medium hover:bg-[#d67002] transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#ee7f03] dark:hover:bg-[#ee7f03]"
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sauvegarde…
            </>
          ) : (
            "Sauvegarder"
          )}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium dark:text-emerald-400">
            Identité visuelle sauvegardée
          </span>
        )}
      </div>
    </div>
  );
}
