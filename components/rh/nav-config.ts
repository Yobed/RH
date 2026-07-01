import {
  LayoutGrid,
  Users,
  Banknote,
  PieChart,
  GraduationCap,
  ShieldCheck,
  Bot,
  Settings,
  Network,
  FileText,
  Calendar,
  Clock,
  Stethoscope,
  UserPlus,
  UserMinus,
  CalendarCheck,
  BarChart3,
  FileCheck,
  Landmark,
  ShieldAlert,
  CalendarDays,
  TrendingUp,
  Library,
  Archive,
  Scale,
  Presentation,
  MessageSquare,
  Bell,
  Calculator,
  Plug,
  HelpCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Taxonomie de navigation — source unique partagée par la rail latérale
// (desktop) et le tiroir mobile. 7 domaines + Admin. Un seul jeu d'icônes
// (Lucide). La longue traîne de routes est couverte par ⌘K (CommandPalette).
// ─────────────────────────────────────────────────────────────────────────

export interface NavLeaf {
  href: string;
  label: string;
  desc?: string;
  icon: React.ElementType;
  pulse?: boolean;
}

export interface NavDomain {
  id: string;
  label: string;
  icon: React.ElementType;
  /** Lien direct (pas de sous-menu) — ex. Tableau de bord. */
  href?: string;
  items?: NavLeaf[];
  adminOnly?: boolean;
}

export const NAV_DOMAINS: NavDomain[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutGrid, href: "/rh" },
  {
    id: "people",
    label: "Collaborateurs",
    icon: Users,
    items: [
      { href: "/employes", label: "Fiches collaborateurs", desc: "Dossiers des salariés", icon: Users },
      { href: "/employes/organigramme", label: "Organigramme", desc: "Structure hiérarchique", icon: Network },
      { href: "/contrats", label: "Contrats", desc: "CDI, CDD, avenants", icon: FileText },
      { href: "/pointage", label: "Pointage biométrique", desc: "Heures & géolocalisation", icon: Clock },
      { href: "/conges", label: "Absences & Congés", desc: "Demandes et soldes", icon: Calendar },
      { href: "/onboarding", label: "Onboarding", desc: "Intégration d'un arrivant", icon: UserPlus, pulse: true },
      { href: "/offboarding", label: "Offboarding", desc: "Parcours de départ", icon: UserMinus },
      { href: "/planning", label: "Planning & Équipes", desc: "Rotations & shifts", icon: CalendarCheck },
      { href: "/heures-sup", label: "Heures supplémentaires", desc: "Suivi & majoration", icon: Clock },
      { href: "/medical", label: "Visites médicales", desc: "Médecine du travail", icon: Stethoscope },
    ],
  },
  {
    id: "paie",
    label: "Paie",
    icon: Banknote,
    items: [
      { href: "/paie", label: "Bulletins de paie", desc: "Édition des bulletins", icon: Banknote },
      { href: "/paie/generer-lot", label: "Génération en lot", desc: "Tous les bulletins", icon: FileCheck },
      { href: "/paie/bordereau", label: "Bordereau de virement", desc: "Ordre bancaire", icon: Landmark },
      { href: "/paie/anomalies", label: "Anomalies de paie", desc: "Écarts détectés", icon: ShieldAlert, pulse: true },
      { href: "/paie/fin-de-contrat", label: "Solde de tout compte", desc: "STC en fin de contrat", icon: FileText },
      { href: "/declarations", label: "Déclarations sociales", desc: "CNPS, ITS, FDFP", icon: FileCheck },
      { href: "/analyses", label: "Masse salariale", desc: "Coûts & répartition", icon: BarChart3 },
    ],
  },
  {
    id: "talents",
    label: "Talents",
    icon: GraduationCap,
    items: [
      { href: "/recrutement", label: "Recrutement", desc: "Offres & candidatures", icon: UserPlus },
      { href: "/evaluations", label: "Évaluations & Performance", desc: "Entretiens annuels", icon: TrendingUp },
      { href: "/formation", label: "Formation & FDFP", desc: "Plan & taxe formation", icon: GraduationCap },
    ],
  },
  {
    id: "analytique",
    label: "Analytique",
    icon: PieChart,
    items: [
      { href: "/analytique", label: "Analytique RH", desc: "Tableaux de bord BI", icon: PieChart },
      { href: "/reporting", label: "Reporting RH", desc: "Rapports & exports", icon: Presentation },
      { href: "/calendrier", label: "Calendrier global", desc: "Événements d'entreprise", icon: CalendarDays },
      { href: "/analytique/risque-depart", label: "Risque de départ", desc: "Turnover prévisionnel", icon: UserMinus },
      { href: "/analytique/prevision", label: "Prévision effectifs", desc: "Projection N+1", icon: TrendingUp },
      { href: "/analytique/cohortes", label: "Cohortes d'embauche", desc: "Par année d'arrivée", icon: Users },
    ],
  },
  {
    id: "conformite",
    label: "Conformité",
    icon: ShieldCheck,
    items: [
      { href: "/disciplinaire", label: "Procédures disciplinaires", desc: "Sanctions & avertissements", icon: ShieldAlert },
      { href: "/contentieux", label: "Contentieux", desc: "Litiges & inspections", icon: Scale },
      { href: "/qhse", label: "QHSE & Accidents", desc: "Sécurité au travail", icon: Stethoscope },
      { href: "/duerp", label: "Risques pro (DUERP)", desc: "Évaluation obligatoire", icon: ShieldAlert },
      { href: "/documents-rh", label: "Documents RH", desc: "Attestations & modèles", icon: FileText },
      { href: "/ged", label: "Documents numérisés (GED)", desc: "Coffre-fort documentaire", icon: Library, pulse: true },
      { href: "/archives", label: "Archives", desc: "Dossiers clôturés", icon: Archive },
    ],
  },
  {
    id: "outils",
    label: "Outils",
    icon: Bot,
    items: [
      { href: "/agent-juridique", label: "Agent juridique IA", desc: "Droit du travail CI", icon: Bot },
      { href: "/calculateur", label: "Simulateur de paie", desc: "Calculs net & brut", icon: Calculator },
      { href: "/messages", label: "Messagerie interne", desc: "Échanges d'équipe", icon: MessageSquare },
      { href: "/notifications", label: "Notifications & Alertes", desc: "Rappels & échéances", icon: Bell },
      { href: "/aide", label: "Guide & Aide", desc: "Documentation des modules", icon: HelpCircle },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    icon: Settings,
    adminOnly: true,
    items: [
      { href: "/parametres", label: "Paramètres généraux", desc: "Configuration entreprise", icon: Settings },
      { href: "/parametres/workflows", label: "Circuits d'approbation", desc: "Valideurs & règles", icon: TrendingUp },
      { href: "/parametres/permissions", label: "Rôles & Permissions", desc: "Gestion des accès", icon: Users },
      { href: "/parametres/securite", label: "Sécurité & Audit", desc: "2FA & historique", icon: ShieldCheck },
      { href: "/parametres/whatsapp", label: "WhatsApp & Intégrations", desc: "Notifications & API", icon: Plug },
    ],
  },
];

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  responsable_rh: "Resp. RH",
  rh: "Chargé(e) RH",
  manager: "Manager",
  employee: "Collaborateur",
  salarie: "Collaborateur",
};

export function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

/** Domaine actif pour un pathname donné. */
export function isDomainActive(domain: NavDomain, pathname: string): boolean {
  if (domain.href) return domain.href === "/rh" ? pathname === "/rh" : pathname.startsWith(domain.href);
  return (domain.items ?? []).some((it) => pathname.startsWith(it.href));
}

/** Lien feuille actif (longest-match pour éviter les faux positifs). */
export function isLeafActive(href: string, pathname: string): boolean {
  if (href === "/rh") return pathname === "/rh";
  return pathname === href || pathname.startsWith(href + "/");
}
