"use client";

import { useState, useEffect } from "react";
import { SidebarNav } from "./SidebarNav";
import { usePathname } from "next/navigation";

interface MobileSidebarProps {
  companyName?: string;
}

export function MobileSidebar({ companyName }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fermer le drawer à chaque changement de page
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col lg:hidden transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}
      >
        {/* Header du drawer */}
        <div
          className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <p className="text-sm font-bold" style={{ color: "var(--sidebar-accent-foreground)" }}>
            {companyName ?? "RH Manager CI"}
          </p>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p
            className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}
          >
            Modules
          </p>
          <SidebarNav />
        </div>
      </aside>
    </>
  );
}
