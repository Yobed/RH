"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  SquaresFour,
  Users,
  FileText,
  UserPlus,
  ChartLineUp,
  Scales,
  Archive,
  Robot,
  Gear,
  Calculator,
  CalendarBlank,
  Money,
  Bell,
  ChartPieSlice,
  Clock,
  ChartBar,
  FirstAid,
  Presentation,
  ChatCircleText,
} from "@phosphor-icons/react";
import { useState } from "react";

const navItems = [
  { href: "/rh", label: "Tableau de bord", icon: SquaresFour, exact: true },
  { href: "/analytique", label: "Analytique", icon: ChartPieSlice, exact: false },
  { href: "/employes", label: "Employés", icon: Users, exact: false },
  { href: "/contrats", label: "Contrats", icon: FileText, exact: false },
  { href: "/conges", label: "Congés", icon: CalendarBlank, exact: false },
  { href: "/paie", label: "Paie", icon: Money, exact: true },
  { href: "/rh/heures-sup", label: "Heures supplémentaires", icon: Clock, exact: false },
  { href: "/rh/analyses", label: "Analyses & Finance", icon: ChartBar, exact: false },
  { href: "/paie/fin-de-contrat", label: "Fin de contrat", icon: FileText, exact: false },
  { href: "/recrutement", label: "Recrutement", icon: UserPlus, exact: false },
  { href: "/evaluations", label: "Évaluations", icon: ChartLineUp, exact: false },
  { href: "/contentieux", label: "Contentieux", icon: Scales, exact: false },
  { href: "/qhse", label: "QHSE", icon: FirstAid, exact: false },
  { href: "/reporting", label: "Reporting", icon: Presentation, exact: false },
  { href: "/messages", label: "Messagerie", icon: ChatCircleText, exact: false },
  { href: "/notifications", label: "Notifications", icon: Bell, exact: false },
  { href: "/archives", label: "Archives", icon: Archive, exact: false },
  { href: "/agent-juridique", label: "Agent Juridique", icon: Robot, exact: false },
  { href: "/calculateur", label: "Calculateur RH", icon: Calculator, exact: false },
];

const bottomItems = [
  { href: "/parametres", label: "Paramètres", icon: Gear, exact: false },
];

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors"
      style={{
        color: isActive ? "var(--sidebar-primary-foreground)" : "var(--sidebar-foreground)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background Highlight */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-highlight"
          className="absolute inset-0 rounded-lg"
          style={{ background: "var(--sidebar-primary)" }}
          initial={false}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      {!isActive && isHovered && (
        <motion.div
          layoutId="sidebar-hover-highlight"
          className="absolute inset-0 rounded-lg"
          style={{ background: "var(--sidebar-accent)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-3 w-full">
        <Icon weight={isActive ? "fill" : "regular"} className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
        <span
          className="truncate"
          style={{
            fontWeight: isActive ? 600 : 500,
            opacity: isActive ? 1 : 0.75,
            transition: "opacity 0.2s"
          }}
        >
          {label}
        </span>
      </span>
    </Link>
  );
}

export function SidebarNav() {
  return (
    <div className="flex flex-col gap-1 w-full">
      <nav className="space-y-1 relative w-full">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>
      <div className="mt-4 border-t border-sidebar-border pt-4 w-full">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}>
          Système
        </p>
        <nav className="space-y-1 relative w-full">
          {bottomItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
}
