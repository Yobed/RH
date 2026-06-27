"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Buildings,
  CaretDown,
  SignOut,
  SquaresFour,
  Users,
  Money,
  ChartPieSlice,
  Student,
  ShieldCheck,
  Robot,
  Gear,
  TreeStructure,
  FileText,
  CalendarBlank,
  Clock,
  FirstAid,
  UserPlus,
  UserMinus,
  CalendarCheck,
  ChartBar,
  Stamp,
  Bank,
  ShieldWarning,
  UploadSimple,
  Target,
  CalendarDots,
  TrendUp,
  UsersThree,
  FilePdf,
  Books,
  Archive,
  ChartLineUp,
  Scales,
  Presentation,
  ChatCircleText,
  Bell,
  Calculator,
  Key,
  Plug,
  DeviceMobile,
  BellRinging,
  UserCircle,
} from "@phosphor-icons/react";
import { CommandPaletteButton } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { MobileSidebar } from "./MobileSidebar";

// ── Taxonomie : 7 domaines (8 avec Admin) au lieu de ~57 liens ──
// Chaque feuille porte sa propre description : la nav s'explique d'elle-même.
interface NavLeaf {
  href: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  pulse?: boolean;
}
interface NavColumn {
  title: string;
  items: NavLeaf[];
}
interface NavDomain {
  id: string;
  label: string;
  icon: React.ElementType;
  accent: string;
  href?: string;
  columns?: NavColumn[];
  adminOnly?: boolean;
}

const NAV_DOMAINS: NavDomain[] = [
  { id: "dashboard", label: "Tableau de bord", icon: SquaresFour, accent: "#6366f1", href: "/rh" },
  {
    id: "people",
    label: "Collaborateurs",
    icon: Users,
    accent: "#0ea5e9",
    columns: [
      {
        title: "Équipe",
        items: [
          { href: "/employes", label: "Fiches collaborateurs", desc: "Dossiers des salariés", icon: Users },
          { href: "/employes/organigramme", label: "Organigramme", desc: "Structure hiérarchique", icon: TreeStructure },
          { href: "/contrats", label: "Contrats", desc: "CDI, CDD, avenants", icon: FileText },
        ],
      },
      {
        title: "Temps & présence",
        items: [
          { href: "/conges", label: "Absences & Congés", desc: "Demandes et soldes", icon: CalendarBlank },
          { href: "/pointage", label: "Pointage", desc: "Heures d'arrivée / départ", icon: Clock },
          { href: "/heures-sup", label: "Heures supplémentaires", desc: "Suivi & majoration", icon: Clock },
          { href: "/medical", label: "Visites médicales", desc: "Médecine du travail", icon: FirstAid },
        ],
      },
      {
        title: "Cycle de vie",
        items: [
          { href: "/onboarding", label: "Onboarding", desc: "Intégration d'un arrivant", icon: UserPlus, pulse: true },
          { href: "/offboarding", label: "Offboarding", desc: "Parcours de départ", icon: UserMinus },
        ],
      },
      {
        title: "Planning",
        items: [
          { href: "/planning", label: "Planning & équipes", desc: "Rotations (shifts)", icon: CalendarCheck },
          { href: "/planning-gantt", label: "Par ressource", desc: "Vue Gantt", icon: ChartBar, pulse: true },
          { href: "/conges/heatmap", label: "Carte des absences", desc: "Vue annuelle", icon: CalendarBlank },
        ],
      },
    ],
  },
  {
    id: "paie",
    label: "Paie",
    icon: Money,
    accent: "#10b981",
    columns: [
      {
        title: "Paie du mois",
        items: [
          { href: "/paie", label: "Bulletins de paie", desc: "Édition des bulletins", icon: Money },
          { href: "/paie/generer-lot", label: "Génération en lot", desc: "Tous les bulletins", icon: Stamp },
          { href: "/paie/bordereau", label: "Bordereau de virement", desc: "Ordre bancaire", icon: Bank },
          { href: "/paie/anomalies", label: "Anomalies de paie", desc: "Écarts détectés", icon: ShieldWarning, pulse: true },
        ],
      },
      {
        title: "Conformité & analyses",
        items: [
          { href: "/paie/fin-de-contrat", label: "Solde de tout compte", desc: "STC en fin de contrat", icon: FileText },
          { href: "/declarations", label: "Déclarations sociales", desc: "CNPS, ITS, FDFP", icon: Stamp },
          { href: "/analyses", label: "Masse salariale", desc: "Coûts & répartition", icon: ChartBar },
          { href: "/paie/import-sage", label: "Import Sage Paie", desc: "Import des données", icon: UploadSimple },
        ],
      },
    ],
  },
  {
    id: "talents",
    label: "Talents",
    icon: Student,
    accent: "#a855f7",
    columns: [
      {
        title: "Développement RH",
        items: [
          { href: "/recrutement", label: "Recrutement", desc: "Offres & candidatures", icon: UserPlus },
          { href: "/evaluations", label: "Évaluations & Performance", desc: "Entretiens annuels", icon: ChartLineUp },
          { href: "/formation", label: "Formation & FDFP", desc: "Plan & taxe formation", icon: Student },
        ],
      },
    ],
  },
  {
    id: "analytique",
    label: "Analytique",
    icon: ChartPieSlice,
    accent: "#8b5cf6",
    columns: [
      {
        title: "Indicateurs",
        items: [
          { href: "/analytique", label: "Analytique RH", desc: "Tableaux de bord", icon: ChartPieSlice },
          { href: "/analytique/focus", label: "Focus stratégique", desc: "Points d'attention", icon: Target },
          { href: "/reporting", label: "Reporting RH", desc: "Rapports & exports", icon: Presentation },
          { href: "/calendrier", label: "Calendrier global", desc: "Tous les évènements", icon: CalendarDots },
        ],
      },
      {
        title: "Prévisions",
        items: [
          { href: "/analytique/risque-depart", label: "Risque de départ", desc: "Turnover prévisionnel", icon: UserMinus },
          { href: "/analytique/prevision", label: "Prévision effectifs", desc: "Projection N+1", icon: TrendUp },
          { href: "/analytique/cohortes", label: "Cohortes d'embauche", desc: "Par année d'arrivée", icon: UsersThree },
          { href: "/analytique/retraite", label: "Départs en retraite", desc: "Âge de la retraite", icon: CalendarBlank },
        ],
      },
    ],
  },
  {
    id: "conformite",
    label: "Conformité",
    icon: ShieldCheck,
    accent: "#f43f5e",
    columns: [
      {
        title: "Qualité & risques",
        items: [
          { href: "/disciplinaire", label: "Procédures disciplinaires", desc: "Avertissements, sanctions", icon: ShieldWarning },
          { href: "/contentieux", label: "Contentieux", desc: "Litiges & inspections", icon: Scales },
          { href: "/qhse", label: "QHSE & Accidents", desc: "Sécurité au travail", icon: FirstAid },
          { href: "/duerp", label: "Risques pro (DUERP)", desc: "Évaluation des risques", icon: ShieldWarning },
          { href: "/bilan-social", label: "Bilan social annuel", desc: "Synthèse obligatoire", icon: Books },
        ],
      },
      {
        title: "Documents",
        items: [
          { href: "/documents-rh", label: "Documents RH", desc: "Attestations & modèles", icon: FilePdf },
          { href: "/ged", label: "Documents numérisés (GED)", desc: "Coffre-fort documentaire", icon: Books, pulse: true },
          { href: "/archives", label: "Archives", desc: "Dossiers clôturés", icon: Archive },
        ],
      },
    ],
  },
  {
    id: "outils",
    label: "Outils",
    icon: Robot,
    accent: "#14b8a6",
    columns: [
      {
        title: "Assistant IA",
        items: [
          { href: "/agent-juridique", label: "Agent juridique IA", desc: "Droit du travail CI", icon: Robot },
          { href: "/calculateur", label: "Simulateur de paie", desc: "Net, brut, coût employeur", icon: Calculator },
        ],
      },
      {
        title: "Communication",
        items: [
          { href: "/messages", label: "Messagerie interne", desc: "Échanges salariés", icon: ChatCircleText },
          { href: "/notifications", label: "Notifications", desc: "Alertes de l'app", icon: Bell },
          { href: "/rappels", label: "Rappels & Échéances", desc: "À venir sous 30 jours", icon: BellRinging },
        ],
      },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    icon: Gear,
    accent: "#64748b",
    adminOnly: true,
    columns: [
      {
        title: "Réglages",
        items: [
          { href: "/parametres", label: "Paramètres", desc: "Réglages entreprise", icon: Gear },
          { href: "/parametres/workflows", label: "Circuits d'approbation", desc: "Qui valide quoi", icon: ChartLineUp },
          { href: "/parametres/permissions", label: "Rôles & permissions", desc: "Droits d'accès (RBAC)", icon: UsersThree },
          { href: "/parametres/delegations", label: "Délégations", desc: "Déléguer ses droits", icon: UserMinus },
        ],
      },
      {
        title: "Sécurité",
        items: [
          { href: "/parametres/securite", label: "Sécurité & 2FA", desc: "Mot de passe & 2FA", icon: ShieldCheck },
          { href: "/parametres/securite-events", label: "Événements sécurité", desc: "Connexions sensibles", icon: ShieldWarning },
          { href: "/parametres/audit", label: "Journal d'audit", desc: "Historique des actions", icon: ShieldWarning },
        ],
      },
      {
        title: "Intégrations",
        items: [
          { href: "/parametres/whatsapp", label: "WhatsApp Business", desc: "Notifications WhatsApp", icon: ChatCircleText },
          { href: "/parametres/webhooks", label: "Webhooks", desc: "Connexions externes", icon: Plug },
          { href: "/parametres/api", label: "API & Clés", desc: "Accès intégrations", icon: Key },
          { href: "/paie/mobile-money", label: "Mobile Money CI", desc: "Salaires Mobile Money", icon: DeviceMobile },
        ],
      },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  responsable_rh: "Resp. RH",
  rh: "Chargé(e) RH",
  manager: "Manager",
  employee: "Collaborateur",
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// ── Lien feuille dans un méga-menu ──
function LeafLink({ leaf, accent, onNavigate }: { leaf: NavLeaf; accent: string; onNavigate: () => void }) {
  const Icon = leaf.icon;
  return (
    <Link
      href={leaf.href}
      onClick={onNavigate}
      style={{ "--ac": accent } as React.CSSProperties}
      className="group/leaf flex items-start gap-3 rounded-xl px-2.5 py-2 outline-none transition-colors hover:bg-slate-100/80 focus-visible:ring-2 focus-visible:ring-amber-500/60 dark:hover:bg-white/5"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover/leaf:bg-[#FF8200]/10 group-hover/leaf:text-[#FF8200]">
        <Icon weight="duotone" className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{leaf.label}</span>
          {leaf.pulse && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />}
        </span>
        <span className="mt-0.5 block text-[11px] leading-tight text-slate-500 dark:text-slate-400">{leaf.desc}</span>
      </span>
    </Link>
  );
}

// ── Un domaine de la barre (lien direct ou déclencheur de méga-menu) ──
function DomainItem({
  domain,
  active,
  open,
  alignRight,
  onHover,
  onToggle,
  onNavigate,
}: {
  domain: NavDomain;
  active: boolean;
  open: boolean;
  alignRight: boolean;
  onHover: () => void;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const Icon = domain.icon;
  const hasMenu = !!domain.columns;

  const triggerCls = cn(
    "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium tracking-tight transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#FF8200]/60",
    active || open
      ? "bg-[#FF8200]/10 text-[#FF8200] font-semibold"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  );

  return (
    <div className="relative" onMouseEnter={onHover}>
      {hasMenu ? (
        <button type="button" className={triggerCls} aria-expanded={open} onClick={onToggle}>
          <Icon weight={active || open ? "duotone" : "regular"} className="h-4 w-4" />
          <span>{domain.label}</span>
          <CaretDown weight="bold" className={cn("h-2.5 w-2.5 transition-transform duration-200", open && "rotate-180")} />
        </button>
      ) : (
        <Link href={domain.href!} className={triggerCls} onClick={onNavigate}>
          <Icon weight={active ? "duotone" : "regular"} className="h-4 w-4" />
          <span>{domain.label}</span>
        </Link>
      )}

      <AnimatePresence>
        {open && hasMenu && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={cn("absolute top-full z-50 pt-2", alignRight ? "right-0" : "left-0")}
          >
            <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-slate-800 dark:bg-[oklch(0.17_0.03_255)]/95">
              <div className="flex gap-5">
                {domain.columns!.map((col) => (
                  <div key={col.title} className="w-[13.5rem]">
                    <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {col.title}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {col.items.map((it) => (
                        <LeafLink key={it.href} leaf={it} accent={domain.accent} onNavigate={onNavigate} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Menu utilisateur compact (avatar + déconnexion) ──
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
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[12px] font-bold text-white shadow-sm outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#FF8200]/50 bg-gradient-to-br from-[#FF8200] to-[#E06D00]"
        aria-label="Menu utilisateur"
        aria-expanded={open}
      >
        {initials}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-slate-800 dark:bg-[oklch(0.17_0.03_255)]/95"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white bg-gradient-to-br from-[#FF8200] to-[#E06D00]"
              >
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
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 outline-none transition-colors hover:bg-slate-100/80 focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <UserCircle weight="duotone" className="h-4 w-4 text-slate-400" />
                Mon profil
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-rose-600 outline-none transition-colors hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <SignOut weight="bold" className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopNav({
  fullName,
  role,
  companyName = "RH Manager CI",
}: {
  fullName: string | null;
  role?: string | null;
  companyName?: string;
}) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const isAdmin = role === "admin" || role === "responsable_rh";
  const domains = NAV_DOMAINS.filter((d) => !d.adminOnly || isAdmin);

  // Fermer les méga-menus au changement de page + touche Échap
  useEffect(() => setOpenId(null), [pathname]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function isDomainActive(d: NavDomain): boolean {
    if (d.href) return d.href === "/rh" ? pathname === "/rh" : pathname.startsWith(d.href);
    return (d.columns ?? []).some((c) => c.items.some((it) => pathname.startsWith(it.href)));
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[oklch(0.15_0.028_255)]/85 print:hidden">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-1 px-3 sm:px-4">
        {/* Mobile : hamburger */}
        <MobileSidebar companyName={companyName} role={role} />

        {/* Logo */}
        <Link href="/rh" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF8200] to-[#E06D00] text-white shadow-sm transition-transform hover:scale-105">
            <Buildings weight="fill" className="h-4 w-4" />
          </span>
          <span className="hidden flex-col leading-none xl:flex">
            <span className="text-[13px] font-bold tracking-tight text-slate-900 dark:text-white">{companyName}</span>
            <span className="mt-0.5 text-[10px] text-slate-400">Ressources humaines</span>
          </span>
        </Link>

        {/* Navigation desktop */}
        <nav className="ml-2 hidden items-center gap-0.5 lg:flex" onMouseLeave={() => setOpenId(null)}>
          {domains.map((d, i) => (
            <DomainItem
              key={d.id}
              domain={d}
              active={isDomainActive(d)}
              open={openId === d.id}
              alignRight={i >= domains.length - 2}
              onHover={() => setOpenId(d.columns ? d.id : null)}
              onToggle={() => setOpenId((cur) => (cur === d.id ? null : d.id))}
              onNavigate={() => setOpenId(null)}
            />
          ))}
        </nav>

        {/* Actions à droite — épurées */}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden md:block">
            <CommandPaletteButton />
          </div>
          <ThemeToggle />
          <NotificationBell />
          <TopUserMenu fullName={fullName} role={role ?? null} />
        </div>
      </div>
    </header>
  );
}
