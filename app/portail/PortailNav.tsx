"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  UserCircle,
  PenLine,
  BadgeCheck,
  ShieldCheck,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Onglets du portail salarié — version allégée du Cockpit. Corrige l'état actif
// (Next <Link> ne pose pas aria-current → l'onglet actif n'était jamais mis en
// évidence). Accent emerald cohérent avec le shell admin.

const NAV_ITEMS = [
  { href: "/portail", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/portail/planning", label: "Mon planning", icon: Calendar },
  { href: "/portail/bulletins", label: "Mes bulletins", icon: FileText },
  { href: "/portail/conges", label: "Mes congés", icon: CalendarDays },
  { href: "/portail/parcours", label: "Mon parcours", icon: TrendingUp },
  { href: "/portail/attestations", label: "Attestations", icon: BadgeCheck },
  { href: "/portail/signatures", label: "Signatures", icon: PenLine },
  { href: "/portail/coffre-fort", label: "Coffre-fort", icon: ShieldCheck },
  { href: "/portail/profil", label: "Mon profil", icon: UserCircle },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/portail") return pathname === "/portail";
  return pathname === href || pathname.startsWith(href + "/");
}

export function PortailNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-[oklch(0.155_0.030_248)] border-b border-slate-200 dark:border-[oklch(0.220_0.035_248)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors",
                active
                  ? "border-emerald-600 font-semibold text-emerald-700 dark:border-emerald-400 dark:text-emerald-300"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
