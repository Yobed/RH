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
  HandWaving,
  TreeStructure,
  CalendarCheck,
  CalendarDots,
  TrendUp,
  UserMinus,
  Key,
  Plug,
  ShieldCheck,
  UsersThree,
  DeviceMobile,
} from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  pulse?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
  accent: string;
}

const navGroups: NavGroup[] = [
  {
    label: "Vue d'ensemble",
    accent: "#818cf8",
    defaultOpen: true,
    items: [
      { href: "/bienvenue", label: "Bienvenue", icon: HandWaving, exact: true },
      { href: "/rh", label: "Tableau de bord", icon: SquaresFour, exact: true },
      { href: "/rappels", label: "Rappels & Échéances", icon: BellRinging },
      { href: "/analytique", label: "Analytique", icon: ChartPieSlice, exact: true },
      { href: "/analytique/focus", label: "Focus Stratégique", icon: Target },
      { href: "/analytique/risque-depart", label: "Risque de départ", icon: UserMinus },
      { href: "/analytique/prevision", label: "Prévision N+1", icon: TrendUp },
      { href: "/analytique/cohortes", label: "Cohortes d'embauche", icon: UsersThree },
      { href: "/analytique/retraite", label: "Planning retraite", icon: CalendarBlank },
      { href: "/calendrier", label: "Calendrier global", icon: CalendarDots },
    ],
  },
  {
    label: "Collaborateurs",
    accent: "#38bdf8",
    defaultOpen: false,
    items: [
      { href: "/employes", label: "Fiches collaborateurs", icon: Users },
      { href: "/employes/organigramme", label: "Organigramme", icon: TreeStructure },
      { href: "/contrats", label: "Contrats", icon: FileText },
      { href: "/conges", label: "Absences & Congés", icon: CalendarBlank },
      { href: "/conges/heatmap", label: "Heatmap absences", icon: CalendarBlank },
      { href: "/planning", label: "Planning & shifts", icon: CalendarCheck },
      { href: "/planning-gantt", label: "Planning par ressource", icon: ChartBar, pulse: true },
      { href: "/pointage", label: "Pointage", icon: Clock },
      { href: "/heures-sup", label: "Heures supplémentaires", icon: Clock },
      { href: "/onboarding", label: "Onboarding", icon: UserPlus, pulse: true },
      { href: "/offboarding", label: "Offboarding", icon: UserMinus },
    ],
  },
  {
    label: "Paie & Conformité",
    accent: "#34d399",
    defaultOpen: false,
    items: [
      { href: "/paie", label: "Bulletins de paie", icon: Money, exact: true },
      { href: "/analyses", label: "Finance & Data", icon: ChartBar },
      { href: "/paie/generer-lot", label: "Génération en lot", icon: Stamp },
      { href: "/paie/bordereau", label: "Bordereau de virement", icon: Bank },
      { href: "/paie/anomalies", label: "Anomalies de paie", icon: ShieldWarning, pulse: true },
      { href: "/paie/fin-de-contrat", label: "Fin de contrat / STC", icon: FileText },
      { href: "/declarations", label: "Déclarations & Conformité", icon: Stamp },
      { href: "/paie/import-sage", label: "Import Sage Paie", icon: UploadSimple },
    ],
  },
  {
    label: "Documents",
    accent: "#fbbf24",
    defaultOpen: false,
    items: [
      { href: "/documents-rh", label: "Documents RH", icon: FilePdf },
      { href: "/ged", label: "GED", icon: Books, pulse: true },
      { href: "/archives", label: "Archives", icon: Archive },
    ],
  },
  {
    label: "Développement RH",
    accent: "#c084fc",
    defaultOpen: false,
    items: [
      { href: "/recrutement", label: "Recrutement", icon: UserPlus },
      { href: "/evaluations", label: "Évaluations & Performance", icon: ChartLineUp },
      { href: "/formation", label: "Formation FDFP", icon: Student },
    ],
  },
  {
    label: "Qualité & Risques",
    accent: "#f87171",
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
    accent: "#f472b6",
    defaultOpen: false,
    items: [
      { href: "/reporting", label: "Reporting RH", icon: Presentation },
      { href: "/messages", label: "Messagerie interne", icon: ChatCircleText },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Outils & IA",
    accent: "#2dd4bf",
    defaultOpen: false,
    items: [
      { href: "/agent-juridique", label: "Agent juridique IA", icon: Robot },
      { href: "/calculateur", label: "Simulateur paie", icon: Calculator },
    ],
  },
];

function NavLink({
  href,
  label,
  icon: Icon,
  exact = false,
  pulse = false,
  accent,
}: NavItem & { accent: string }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium outline-none transition-all duration-150",
        isActive
          ? "text-white"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      )}
      style={isActive ? { background: `${accent}22` } : undefined}
    >
      {/* Indicateur actif */}
      <span
        aria-hidden
        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full transition-all duration-200"
        style={{
          height: isActive ? "60%" : "0%",
          background: accent,
          opacity: isActive ? 1 : 0,
        }}
      />
      <Icon
        weight={isActive ? "duotone" : "regular"}
        className="h-3.5 w-3.5 shrink-0 transition-colors duration-150"
        style={{ color: isActive ? accent : undefined }}
      />
      <span className="truncate flex-1">{label}</span>
      {pulse && !isActive && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>
      )}
    </Link>
  );
}

function NavSection({ group }: { group: NavGroup }) {
  const pathname = usePathname();
  const hasActive = group.items.some((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  const [open, setOpen] = useState(() => group.defaultOpen ?? hasActive);

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span
            className="w-1 h-1 rounded-full shrink-0 transition-colors duration-200"
            style={{ background: hasActive ? group.accent : "rgba(148,163,184,0.25)" }}
            aria-hidden
          />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.12em] transition-colors duration-200"
            style={{ color: hasActive ? group.accent : "rgba(148,163,184,0.45)" }}
          >
            {group.label}
          </span>
        </span>
        <CaretDown
          weight="bold"
          className={cn(
            "h-2.5 w-2.5 shrink-0 transition-transform duration-200",
            open ? "rotate-0" : "-rotate-90"
          )}
          style={{ color: hasActive ? group.accent : "rgba(148,163,184,0.25)" }}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 pl-1 pb-1.5">
              {group.items.map((item) => (
                <NavLink key={item.href} {...item} accent={group.accent} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarNav({ role }: { role?: string }) {
  const isAdmin = role === "admin" || role === "responsable_rh";

  const allNavGroups = [...navGroups];

  if (isAdmin) {
    allNavGroups.push({
      label: "Administration",
      accent: "#94a3b8",
      defaultOpen: true,
      items: [
        { href: "/parametres", label: "Paramètres", icon: Gear, exact: true },
        { href: "/parametres/workflows", label: "Workflows approbation", icon: ChartLineUp },
        { href: "/parametres/permissions", label: "Permissions RBAC", icon: UsersThree },
        { href: "/parametres/delegations", label: "Délégations", icon: UserMinus },
        { href: "/parametres/securite", label: "Sécurité & 2FA", icon: ShieldCheck },
        { href: "/parametres/securite-events", label: "Événements sécurité", icon: ShieldWarning },
        { href: "/parametres/audit", label: "Journal d'audit", icon: ShieldWarning },
        { href: "/parametres/whatsapp", label: "WhatsApp Business", icon: ChatCircleText },
        { href: "/parametres/webhooks", label: "Webhooks", icon: Plug },
        { href: "/parametres/api", label: "API & Clés", icon: Key },
        { href: "/paie/mobile-money", label: "Mobile Money CI", icon: DeviceMobile },
      ],
    });
  } else {
    allNavGroups.push({
      label: "Compte",
      accent: "#94a3b8",
      defaultOpen: false,
      items: [
        { href: "/parametres", label: "Mon Profil", icon: Gear },
      ],
    });
  }

  return (
    <nav className="flex flex-col gap-0.5 w-full">
      {allNavGroups.map((group) => (
        <NavSection key={group.label} group={group} />
      ))}
    </nav>
  );
}
