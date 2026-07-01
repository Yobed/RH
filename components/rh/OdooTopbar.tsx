"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { LayoutGrid, ChevronDown, LogOut, User, X } from "lucide-react";
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  NAV_DOMAINS,
  isDomainActive,
  isLeafActive,
  ROLE_LABELS,
  getInitials,
  type NavDomain,
} from "./nav-config";
import { CommandPaletteButton } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

// ─────────────────────────────────────────────────────────────────────────
// Barre top « Odoo » — aubergine (#ee7f03). Menu d'apps (grille) à gauche,
// nom de l'app courante + sous-menu horizontal de ses modules, systray à
// droite. Remplace la rail latérale : navigation par apps + breadcrumbs.
// ─────────────────────────────────────────────────────────────────────────

const AUBERGINE = "#ee7f03";

function AppsDrawer({ domains, onClose }: { domains: NavDomain[]; onClose: () => void }) {
  const router = useRouter();

  function go(d: NavDomain) {
    const href = d.href ?? d.items?.[0]?.href ?? "/rh";
    router.push(href);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 top-11 z-40 bg-slate-950/30" onClick={onClose} aria-hidden />
      <div className="absolute left-0 right-0 top-11 z-50 border-b border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 p-4 sm:grid-cols-4 sm:gap-3 sm:p-6">
          {domains.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => go(d)}
                className="group flex flex-col items-center gap-2 rounded-lg border border-transparent p-3 text-center outline-none transition-colors hover:border-slate-200 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#ee7f03]/40 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105"
                  style={{ backgroundColor: AUBERGINE }}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function OdooUserMenu({ fullName, role }: { fullName: string | null; role: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function handleLogout() {
    const supabase = createClientSupabase();
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    router.push("/login");
    router.refresh();
  }

  const initials = getInitials(fullName);
  const roleDisplay = role ? (ROLE_LABELS[role] ?? role) : "Invité";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-2 rounded-full border border-white/25 bg-white/10 pl-1 pr-2.5 text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label="Menu utilisateur"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-bold" style={{ color: AUBERGINE }}>
          {initials}
        </span>
        <span className="hidden max-w-[200px] truncate text-[12px] font-semibold sm:block">{fullName ?? "Compte"}</span>
        <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">{fullName ?? "Utilisateur"}</p>
            <p className="truncate text-[11px] text-slate-400">{roleDisplay}</p>
          </div>
          <div className="p-1.5">
            <Link
              href="/parametres"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <User className="h-4 w-4 text-slate-400" />
              Mon profil
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function OdooTopbar({
  fullName,
  role,
  companyName = "RH Manager CI",
}: {
  fullName: string | null;
  role?: string | null;
  companyName?: string;
}) {
  const pathname = usePathname();
  const [appsOpen, setAppsOpen] = useState(false);
  const isAdmin = role === "admin" || role === "responsable_rh";
  const domains = NAV_DOMAINS.filter((d) => !d.adminOnly || isAdmin);

  // App courante = domaine actif (sinon Tableau de bord).
  const activeDomain = domains.find((d) => isDomainActive(d, pathname)) ?? domains[0];
  const subItems = activeDomain?.items ?? [];

  useEffect(() => setAppsOpen(false), [pathname]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAppsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 text-white print:hidden"
      style={{ backgroundColor: AUBERGINE }}
    >
      <div className="flex h-11 items-center gap-1 px-1.5 sm:px-2">
        {/* Menu d'apps (grille) */}
        <button
          type="button"
          onClick={() => setAppsOpen((v) => !v)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/90 outline-none transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Menu des applications"
          aria-expanded={appsOpen}
        >
          <LayoutGrid className="h-5 w-5" />
        </button>

        {/* Nom de l'app courante */}
        <Link href={activeDomain?.href ?? activeDomain?.items?.[0]?.href ?? "/rh"} className="shrink-0 px-2 text-[13px] font-bold tracking-tight text-white">
          {activeDomain?.label ?? companyName}
        </Link>

        {/* Systray */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <div className="hidden md:block">
            <CommandPaletteButton />
          </div>
          <ThemeToggle />
          <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <NotificationBell />
          </div>
          <OdooUserMenu fullName={fullName} role={role ?? null} />
        </div>
      </div>

      {/* Sous-navigation : pages du module courant — 2e ligne pleine largeur,
          passe à la ligne (flex-wrap) → tous les onglets visibles, aucun scroll. */}
      {subItems.length > 0 && (
        <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <nav className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-1 px-2 py-1.5 sm:px-4">
            {subItems.map((it) => {
              const active = isLeafActive(it.href, pathname);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  title={it.desc ?? it.label}
                  className={cn(
                    "relative whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12.5px] font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#ee7f03]/40",
                    active
                      ? "bg-[#ee7f03]/10 font-semibold text-[#ee7f03] shadow-[inset_0_-2px_0_0_#ee7f03]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-[inset_0_-2px_0_0_rgba(238,127,3,0.25)] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {appsOpen && <AppsDrawer domains={domains} onClose={() => setAppsOpen(false)} />}
    </header>
  );
}
