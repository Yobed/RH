"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase/client";
import { AppMobileNav } from "./AppMobileNav";
import { CommandPaletteButton } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { ROLE_LABELS, getInitials } from "./nav-config";

// Top-bar fine (h-14) — fil d'Ariane + ⌘K + thème + notifications + compte.
// Remplace le méga-menu horizontal : la navigation vit désormais dans la rail.

function TopUserMenu({ fullName, role }: { fullName: string | null; role: string | null }) {
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
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#ee7f03] to-[#d67002] text-[12px] font-bold text-white shadow-xs outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        aria-label="Menu utilisateur"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ee7f03] to-[#d67002] text-[12px] font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">{fullName ?? "Utilisateur"}</p>
              <p className="truncate text-[11px] text-slate-400">{roleDisplay}</p>
            </div>
          </div>
          <div className="p-1.5">
            <Link
              href="/parametres"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 outline-none transition-colors hover:bg-slate-100/80 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <User className="h-4 w-4 text-slate-400" />
              Mon profil
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-rose-600 outline-none transition-colors hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 dark:text-rose-400 dark:hover:bg-rose-500/10"
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

export function AppTopbar({
  fullName,
  role,
  companyName = "RH Manager CI",
}: {
  fullName: string | null;
  role?: string | null;
  companyName?: string;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/70 bg-white/85 px-3 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/85 sm:px-4 print:hidden">
      <AppMobileNav companyName={companyName} role={role} />
      <div className="min-w-0 flex-1" />
      <div className="flex items-center gap-1.5">
        <div className="hidden md:block">
          <CommandPaletteButton />
        </div>
        <ThemeToggle />
        <NotificationBell />
        <TopUserMenu fullName={fullName} role={role ?? null} />
      </div>
    </header>
  );
}
