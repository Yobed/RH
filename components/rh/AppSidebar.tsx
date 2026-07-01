"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Building2, ChevronDown, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NAV_DOMAINS,
  isDomainActive,
  isLeafActive,
  type NavDomain,
  type NavLeaf,
} from "./nav-config";

// ─────────────────────────────────────────────────────────────────────────
// Cockpit RH — rail latérale claire, persistante, repliable (desktop ≥ lg).
// 2 niveaux : domaine → module. Accent unique emerald, fond slate clair.
// Squelette partagé : redessine d'un coup le cadre des 45 pages.
// ─────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "rh.sidebar.collapsed";

function LeafLink({ leaf, pathname }: { leaf: NavLeaf; pathname: string }) {
  const active = isLeafActive(leaf.href, pathname);
  const Icon = leaf.icon;
  return (
    <Link
      href={leaf.href}
      title={leaf.desc ?? leaf.label}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg py-1.5 pl-9 pr-2.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/50",
        active
          ? "bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      )}
    >
      {active && (
        <span aria-hidden className="absolute left-3 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-emerald-600" />
      )}
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{leaf.label}</span>
      {leaf.pulse && !active && (
        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
      )}
    </Link>
  );
}

function DomainGroup({
  domain,
  pathname,
  collapsed,
  open,
  onToggle,
}: {
  domain: NavDomain;
  pathname: string;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = domain.icon;
  const active = isDomainActive(domain, pathname);

  // Lien direct (Tableau de bord)
  if (domain.href) {
    return (
      <Link
        href={domain.href}
        title={domain.label}
        className={cn(
          "group relative flex items-center rounded-lg py-2 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/50",
          collapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
          active
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        )}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-emerald-600 dark:text-emerald-400")} />
        {!collapsed && <span className="truncate">{domain.label}</span>}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        title={domain.label}
        className={cn(
          "group flex w-full cursor-pointer items-center rounded-lg py-2 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/50",
          collapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
          active
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        )}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-emerald-600 dark:text-emerald-400")} />
        {!collapsed && (
          <>
            <span className="truncate">{domain.label}</span>
            <ChevronDown className={cn("ml-auto h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
          </>
        )}
      </button>

      {!collapsed && open && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {domain.items!.map((leaf) => (
            <LeafLink key={leaf.href} leaf={leaf} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AppSidebar({ companyName = "RH Manager CI", role }: { companyName?: string; role?: string | null }) {
  const pathname = usePathname();
  const isAdmin = role === "admin" || role === "responsable_rh";
  const domains = NAV_DOMAINS.filter((d) => !d.adminOnly || isAdmin);

  const [collapsed, setCollapsed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  // Restaure l'état replié + ouvre le domaine actif au montage.
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    }
    const activeDomain = domains.find((d) => !d.href && isDomainActive(d, pathname));
    setOpenId(activeDomain?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  function handleGroupToggle(id: string) {
    // En mode replié, déplier la rail et ouvrir le groupe ciblé.
    if (collapsed) {
      setCollapsed(false);
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, "0");
      setOpenId(id);
      return;
    }
    setOpenId((cur) => (cur === id ? null : id));
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-slate-200/80 bg-white transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-900 lg:flex print:hidden",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* En-tête : logo + marque */}
      <div className={cn("flex h-14 shrink-0 items-center border-b border-slate-200/70 dark:border-slate-800", collapsed ? "justify-center px-0" : "px-4")}>
        <Link href="/rh" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ee7f03] to-[#d67002] text-white shadow-xs">
            <Building2 className="h-4 w-4" />
          </span>
          {!collapsed && (
            <span className="flex min-w-0 flex-col leading-none">
              <span className="truncate font-display text-[13px] font-bold tracking-tight text-slate-900 dark:text-white">{companyName}</span>
              <span className="mt-0.5 text-[10px] font-medium text-slate-500">Ressources humaines</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto py-3", collapsed ? "px-2" : "px-3")}>
        {domains.map((d) => (
          <DomainGroup
            key={d.id}
            domain={d}
            pathname={pathname}
            collapsed={collapsed}
            open={openId === d.id}
            onToggle={() => handleGroupToggle(d.id)}
          />
        ))}
      </nav>

      {/* Pied : repli */}
      <div className="shrink-0 border-t border-slate-200/70 p-2 dark:border-slate-800">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex w-full cursor-pointer items-center rounded-lg py-2 text-[12px] font-medium text-slate-500 outline-none transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:text-slate-400 dark:hover:bg-slate-800",
            collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"
          )}
          title={collapsed ? "Déplier le menu" : "Replier le menu"}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Replier</span>}
        </button>
      </div>
    </aside>
  );
}
