"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { toast } from "sonner";

// Copie un lien absolu (origin + path) dans le presse-papier — ex. lien d'une offre.
export function CopyLinkButton({ path, label = "Copier le lien" }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
    >
      {copied ? <Check className="h-4 w-4 text-[#69b5a2]" /> : <Link2 className="h-4 w-4 text-slate-400" />}
      {label}
    </button>
  );
}
