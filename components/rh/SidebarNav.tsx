"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Target,
  UploadSimple,
  Stamp,
  BellRinging,
  FilePdf,
  Bank,
  Student,
  ShieldWarning,
  Books,
  CaretDown,
} from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: "Vue d'ensemble",
    defaultOpen: true,
    items: [
      { href: "/rh", label: "Tableau de bord", icon: SquaresFour, exact: true },
      { href: "/rappels", label: "Rappels & Échéances", icon: BellRinging },
      { href: "/analytique", label: "Analytique", icon: ChartPieSlice, exact: true },
      { href: "/analytique/focus", label: "Focus Stratégique", icon: Target },
    ],
  },
  {
    label: "Collaborateurs",
    defaultOpen: true,
    items: [
      { href: "/employes", label: "Fiches collaborateurs", icon: Users },
      { href: "/contrats", label: "Contrats", icon: FileText },
      { href: "/conges", label: "Absences & Congés", icon: CalendarBlank },
      { href: "/heures-sup", label: "Heures supplémentaires", icon: Clock },
    ],
  },
  {
    label: "Paie & Conformité",
    defaultOpen: true,
    items: [
      { href: "/paie", label: "Bulletins de paie", icon: Money, exact: true },
      { href: "/analyses", label: "Finance & Data", icon: ChartBar },
      { href: "/paie/generer-lot", label: "Génération en lot", icon: Stamp },
      { href: "/paie/bordereau", label: "Bordereau de virement", icon: Bank },
      { href: "/paie/fin-de-contrat", label: "Fin de contrat / STC", icon: FileText },
      { href: "/declarations", label: "Déclarations & Conformité", icon: Stamp },
      { href: "/paie/import-sage", label: "Import Sage Paie", icon: UploadSimple },
    ],
  },
  {
    label: "Documents",
    defaultOpen: false,
    items: [
      { href: "/documents-rh", label: "Documents RH", icon: FilePdf },
      { href: "/archives", label: "Archives", icon: Archive },
    ],
  },
  {
    label: "Développement RH",
    defaultOpen: false,
    items: [
      { href: "/recrutement", label: "Talent Acquisition", icon: UserPlus },
      { href: "/evaluations", label: "Évaluations & Performance", icon: ChartLineUp },
      { href: "/formation", label: "Formation FDFP", icon: Student },
    ],
  },
  {
    label: "Qualité & Risques",
    defaultOpen: false,
    items: [
      { href: "/contentieux", label: "Contentieux", icon: Scales },
      { href: "/qhse", label: "QHSE & Accidents", icon: FirstAid },
      { href: "/duerp", label: "DUERP", icon: ShieldWarning },
      { href: "/bilan-social", label: "Bilan social annuel", icon: Books },
    ],
  },
  {
    label: "Reporting & Comms",
    defaultOpen: false,
    items: [
      { href: "/reporting", label: "Reporting RH", icon: Presentation },
      { href: "/messages", label: "Messagerie interne", icon: ChatCircleText },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Outils & IA",
    defaultOpen: false,
    items: [
      { href: "/agent-juridique", label: "Agent juridique IA", icon: Robot },
      { href: "/calculateur", label: "Simulateur paie", icon: Calculator },
    ],
  },
];

const bottomItems: NavItem[] = [
  { href: "/parametres", label: "Paramètres", icon: Gear },
];

function NavLink({ href, label, icon: Icon, exact = false }: NavItem) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] outline-none transition-all duration-200",
        isActive
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
      )}
    >
      <Icon
        weight={isActive ? "duotone" : "bold"}
        className={cn(
          "h-4 w-4 shrink-0 transition-all duration-300",
          isActive
            ? "text-amber-400"
            : "text-slate-400 group-hover:text-slate-600"
        )}
      />
      <span className={cn("truncate", isActive ? "font-semibold" : "font-medium")}>
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="active-dot"
          className="ml-auto w-1 h-3 bg-amber-400 rounded-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
}

function NavSection({ group }: { group: NavGroup }) {
  const pathname = usePathname();
  const hasActive = group.items.some((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  const [open, setOpen] = useState(group.defaultOpen ?? hasActive);

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-slate-100/60 group"
        style={{ color: "var(--sidebar-foreground)", opacity: hasActive ? 1 : 0.45 }}
      >
        <span className="group-hover:opacity-100">{group.label}</span>
        <CaretDown
          weight="bold"
          className={cn(
            "h-3 w-3 shrink-0 transition-transform duration-200",
            open ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 pb-1">
              {group.items.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarNav() {
  return (
    <div className="flex flex-col gap-1 w-full">
      <nav className="flex flex-col gap-1 w-full">
        {navGroups.map((group) => (
          <NavSection key={group.label} group={group} />
        ))}
      </nav>

      <div className="w-full mt-2">
        <div className="px-3 mb-2">
          <div className="h-px w-full bg-slate-100" />
        </div>
        <nav className="flex flex-col gap-0.5">
          {bottomItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
}
