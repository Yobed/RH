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
  Student
} from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/rh", label: "Dashboard", icon: SquaresFour, exact: true },
  { href: "/rappels", label: "Rappels & Échéances", icon: BellRinging, exact: false },
  { href: "/analytique", label: "Analytique", icon: ChartPieSlice, exact: true },
  { href: "/analytique/focus", label: "Focus Stratégique", icon: Target, exact: false },
  { href: "/employes", label: "Collaborateurs", icon: Users, exact: false },
  { href: "/contrats", label: "Gestion Contrats", icon: FileText, exact: false },
  { href: "/conges", label: "Absences", icon: CalendarBlank, exact: false },
  { href: "/paie", label: "Paie & Salaires", icon: Money, exact: true },
  { href: "/heures-sup", label: "Heures Sup.", icon: Clock, exact: false },
  { href: "/analyses", label: "Finance & Data", icon: ChartBar, exact: false },
  { href: "/paie/generer-lot", label: "Génération en lot", icon: Stamp, exact: false },
  { href: "/paie/bordereau", label: "Bordereau virement", icon: Bank, exact: false },
  { href: "/paie/fin-de-contrat", label: "Fin de contrat", icon: FileText, exact: false },
  { href: "/declarations", label: "Déclarations & Conformité", icon: Stamp, exact: false },
  { href: "/documents-rh", label: "Documents RH", icon: FilePdf, exact: false },
  { href: "/paie/import-sage", label: "Import Paie Sage", icon: UploadSimple, exact: false },
  { href: "/recrutement", label: "Talent Acquisition", icon: UserPlus, exact: false },
  { href: "/evaluations", label: "Performance", icon: ChartLineUp, exact: false },
  { href: "/formation", label: "Formation FDFP", icon: Student, exact: false },
  { href: "/contentieux", label: "Contentieux", icon: Scales, exact: false },
  { href: "/qhse", label: "QHSE & Risques", icon: FirstAid, exact: false },
  { href: "/reporting", label: "Reporting RH", icon: Presentation, exact: false },
  { href: "/messages", label: "Internal Comms", icon: ChatCircleText, exact: false },
  { href: "/notifications", label: "Flux Alerts", icon: Bell, exact: false },
  { href: "/archives", label: "Documents", icon: Archive, exact: false },
  { href: "/agent-juridique", label: "Legal AI", icon: Robot, exact: false },
  { href: "/calculateur", label: "Smart Calculator", icon: Calculator, exact: false },
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
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-300",
        isActive 
          ? "bg-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)]" 
          : "text-slate-600 hover:text-slate-900"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {!isActive && isHovered && (
          <motion.div
            layoutId="sidebar-hover"
            className="absolute inset-0 rounded-xl bg-slate-100/80 -z-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex items-center gap-3 w-full">
        <Icon 
          weight={isActive ? "duotone" : "bold"} 
          className={cn(
            "h-5 w-5 shrink-0 transition-all duration-500",
            isActive ? "text-amber-400 group-hover:rotate-[12deg]" : "text-slate-400 group-hover:text-slate-900"
          )} 
        />
        <span
          className={cn(
            "truncate tracking-tight",
            isActive ? "font-black" : "font-bold"
          )}
        >
          {label}
        </span>

        {isActive && (
          <motion.div 
            layoutId="active-dot"
            className="w-1 h-4 bg-amber-400 rounded-full ml-auto"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </div>
    </Link>
  );
}

export function SidebarNav() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <nav className="flex flex-col gap-1 relative w-full pt-2">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>
      
      <div className="w-full">
        <div className="px-4 mb-4">
           <div className="h-[1px] w-full bg-slate-100 flex items-center justify-center">
             <span className="bg-white px-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Système</span>
           </div>
        </div>
        <nav className="flex flex-col gap-1 relative w-full">
          {bottomItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
}
