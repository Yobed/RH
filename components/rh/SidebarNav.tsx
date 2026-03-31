"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  UserPlus,
  BarChart2,
  Scale,
  Archive,
  Bot,
  Settings,
  Calculator,
  CalendarDays,
  Banknote,
  Bell,
  TrendingUp,
} from "lucide-react";

const navItems = [
  { href: "/rh", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/employes", label: "Employés", icon: Users, exact: false },
  { href: "/contrats", label: "Contrats", icon: FileText, exact: false },
  { href: "/conges", label: "Congés", icon: CalendarDays, exact: false },
  { href: "/paie", label: "Paie", icon: Banknote, exact: true },
  { href: "/paie/masse-salariale", label: "Masse salariale", icon: TrendingUp, exact: false },
  { href: "/paie/fin-de-contrat", label: "Fin de contrat", icon: FileText, exact: false },
  { href: "/recrutement", label: "Recrutement", icon: UserPlus, exact: false },
  { href: "/evaluations", label: "Évaluations", icon: BarChart2, exact: false },
  { href: "/contentieux", label: "Contentieux", icon: Scale, exact: false },
  { href: "/notifications", label: "Notifications", icon: Bell, exact: false },
  { href: "/archives", label: "Archives", icon: Archive, exact: false },
  { href: "/agent-juridique", label: "Agent Juridique", icon: Bot, exact: false },
  { href: "/calculateur", label: "Calculateur RH", icon: Calculator, exact: false },
];

const bottomItems = [
  { href: "/parametres", label: "Paramètres", icon: Settings, exact: false },
];

function NavLink({ href, label, icon: Icon, exact }: { href: string; label: string; icon: React.ElementType; exact: boolean }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
      style={
        isActive
          ? {
              background: "var(--sidebar-primary)",
              color: "var(--sidebar-primary-foreground)",
              fontWeight: 600,
            }
          : {
              color: "var(--sidebar-foreground)",
              opacity: 0.75,
            }
      }
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "var(--sidebar-accent)";
          (e.currentTarget as HTMLElement).style.color = "var(--sidebar-accent-foreground)";
          (e.currentTarget as HTMLElement).style.opacity = "1";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--sidebar-foreground)";
          (e.currentTarget as HTMLElement).style.opacity = "0.75";
        }
      }}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function SidebarNav() {
  return (
    <div className="flex flex-col gap-1">
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>
      <div className="mt-4 border-t pt-3 space-y-1">
        <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Système
        </p>
        {bottomItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
}
