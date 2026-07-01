"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Building2, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NAV_DOMAINS,
  isDomainActive,
  isLeafActive,
  type NavDomain,
} from "./nav-config";

// Tiroir de navigation mobile (< lg) — variante claire, même taxonomie que la
// rail desktop. Auto-fermeture au changement de route. Rendu via portal.

function MobileGroup({
  domain,
  pathname,
  open,
  onToggle,
}: {
  domain: NavDomain;
  pathname: string;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = domain.icon;
  const active = isDomainActive(domain, pathname);

  if (domain.href) {
    return (
      <Link
        href={domain.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
          active ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {domain.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
          active ? "text-emerald-700" : "text-slate-700 hover:bg-slate-100"
        )}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-emerald-600")} />
        <span>{domain.label}</span>
        <ChevronDown className={cn("ml-auto h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mb-1 mt-0.5 flex flex-col gap-0.5">
          {domain.items!.map((leaf) => {
            const LeafIcon = leaf.icon;
            const leafActive = isLeafActive(leaf.href, pathname);
            return (
              <Link
                key={leaf.href}
                href={leaf.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg py-2 pl-10 pr-3 text-[13px] font-medium transition-colors",
                  leafActive ? "bg-emerald-50 font-semibold text-emerald-700" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <LeafIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{leaf.label}</span>
                {leaf.pulse && !leafActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppMobileNav({ companyName = "RH Manager CI", role }: { companyName?: string; role?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const isAdmin = role === "admin" || role === "responsable_rh";
  const domains = NAV_DOMAINS.filter((d) => !d.adminOnly || isAdmin);

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const drawer = (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[10000] flex w-[284px] max-w-[86vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden dark:bg-slate-900",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <span className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#ee7f03] to-[#d67002] text-white">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="truncate font-display text-[13px] font-bold tracking-tight text-slate-900 dark:text-white">{companyName}</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {domains.map((d) => (
            <MobileGroup
              key={d.id}
              domain={d}
              pathname={pathname}
              open={openId === d.id}
              onToggle={() => setOpenId((cur) => (cur === d.id ? null : d.id))}
            />
          ))}
        </nav>
      </aside>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Ouvrir le menu de navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      {mounted && typeof document !== "undefined" && createPortal(drawer, document.body)}
    </>
  );
}
