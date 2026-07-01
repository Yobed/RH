"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SidebarNav } from "./SidebarNav";
import { usePathname } from "next/navigation";

interface MobileSidebarProps {
  companyName?: string;
  role?: string | null;
}

export function MobileSidebar({ companyName, role }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Fermer le drawer à chaque changement de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // S'assurer que le portail n'est rendu que sur le client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Empêcher le défilement du corps de la page lorsque le drawer est ouvert
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const drawerContent = (
    <>
      {/* Backdrop sombre interactif */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer latéral mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-[10000] flex w-[280px] max-w-[85vw] flex-col lg:hidden transition-transform duration-300 ease-in-out shadow-2xl ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: "#0b132a",
          backgroundImage: "linear-gradient(165deg, #121c3b 0%, #0b132a 60%, #070d1e 100%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* En-tête du drawer */}
        <div
          className="flex h-16 items-center justify-between px-5 shrink-0"
          style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ee7f03] text-white font-bold text-xs shadow-sm">
              RH
            </span>
            <p className="text-sm font-bold text-white tracking-tight truncate max-w-[170px]">
              {companyName ?? "RH Manager CI"}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Fermer le menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Liste de navigation scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-60">
            Modules RH
          </p>
          <SidebarNav role={role || undefined} />
        </div>

        {/* Pied du drawer mobile */}
        <div
          className="p-4 shrink-0 text-center"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}
        >
          <p className="text-[11px] text-slate-400 font-medium">
            © RH Manager CI · Côte d'Ivoire
          </p>
        </div>
      </aside>
    </>
  );

  return (
    <>
      {/* Bouton Hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#ee7f03] hover:border-[#f8d3a3] dark:hover:text-[#f6c68a] active:scale-95 transition-all shadow-sm lg:hidden"
        aria-label="Ouvrir le menu de navigation"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Rendu via React Portal hors du header pour éviter les restrictions de conteneur CSS */}
      {mounted && typeof document !== "undefined" && createPortal(
        drawerContent,
        document.body
      )}
    </>
  );
}


