"use client";

import { useState, useRef, useEffect } from "react";
import { Question } from "@phosphor-icons/react";

// Aide contextuelle « ? » : explique en langage clair à quoi sert la page
// (et le contexte légal ivoirien si pertinent). Réduit la charge mentale :
// l'utilisateur comprend la page sans deviner ni quitter l'écran.
export function PageHelp({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="À quoi sert cette page ?"
        aria-expanded={open}
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-400 outline-none transition-colors hover:border-[#f8d3a3] hover:text-[#ee7f03] focus-visible:ring-2 focus-visible:ring-[#f6c68a] dark:border-slate-700 dark:text-slate-500 dark:hover:border-[#ee7f03] dark:hover:text-[#f6c68a]"
      >
        <Question weight="bold" className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute left-0 top-8 z-50 w-72 rounded-xl border border-slate-200 bg-white p-3 text-[12.5px] leading-relaxed text-slate-600 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.2)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          {text}
        </div>
      )}
    </div>
  );
}
