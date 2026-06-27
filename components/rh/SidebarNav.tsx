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
  /** Texte d'aide au survol — explicite les sigles (GED, DUERP, STC…) */
  desc?: string;
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
    accent: "#2563eb",
    defaultOpen: true,
    items: [
      { href: "/bienvenue", label: "Bienvenue", icon: HandWaving, exact: true, desc: "Prise en main de l'application" },
      { href: "/rh", label: "Tableau de bord", icon: SquaresFour, exact: true, desc: "Vue d'accueil : indicateurs clés et actions du jour" },
      { href: "/rappels", label: "Rappels & Échéances", icon: BellRinging, desc: "Contrats, visites médicales et essais qui arrivent à échéance" },
      { href: "/calendrier", label: "Calendrier global", icon: CalendarDots, desc: "Tous les évènements RH sur un calendrier" },
    ],
  },
  {
    label: "Collaborateurs",
    accent: "#2563eb",
    defaultOpen: false,
    items: [
      { href: "/employes", label: "Fiches collaborateurs", icon: Users, desc: "Liste et dossiers des salariés" },
      { href: "/employes/organigramme", label: "Organigramme", icon: TreeStructure, desc: "Structure hiérarchique de l'entreprise" },
      { href: "/contrats", label: "Contrats", icon: FileText, desc: "CDI, CDD et avenants" },
      { href: "/conges", label: "Absences & Congés", icon: CalendarBlank, desc: "Demandes et soldes de congés" },
      { href: "/pointage", label: "Pointage", icon: Clock, desc: "Heures d'arrivée et de départ" },
      { href: "/heures-sup", label: "Heures supplémentaires", icon: Clock, desc: "Suivi et majoration des heures sup" },
      { href: "/medical", label: "Visites médicales", icon: FirstAid, desc: "Suivi de la médecine du travail" },
      { href: "/onboarding", label: "Onboarding (intégration)", icon: UserPlus, pulse: true, desc: "Parcours d'arrivée d'un nouveau salarié" },
      { href: "/offboarding", label: "Offboarding (départ)", icon: UserMinus, desc: "Parcours de départ d'un salarié" },
    ],
  },
  {
    label: "Planning",
    accent: "#2563eb",
    defaultOpen: false,
    items: [
      { href: "/planning", label: "Planning & équipes", icon: CalendarCheck, desc: "Plannings et rotations d'équipes (shifts)" },
      { href: "/planning-gantt", label: "Planning par ressource", icon: ChartBar, pulse: true, desc: "Vue Gantt par salarié ou par poste" },
      { href: "/conges/heatmap", label: "Carte des absences", icon: CalendarBlank, desc: "Vue chaleur des absences sur l'année" },
    ],
  },
  {
    label: "Paie & Conformité",
    accent: "#2563eb",
    defaultOpen: false,
    items: [
      { href: "/paie", label: "Bulletins de paie", icon: Money, exact: true, desc: "Édition des bulletins de salaire" },
      { href: "/paie/generer-lot", label: "Génération en lot", icon: Stamp, desc: "Générer tous les bulletins du mois en une fois" },
      { href: "/paie/bordereau", label: "Bordereau de virement", icon: Bank, desc: "Ordre de virement des salaires à la banque" },
      { href: "/paie/anomalies", label: "Anomalies de paie", icon: ShieldWarning, pulse: true, desc: "Écarts et erreurs détectés sur la paie" },
      { href: "/paie/fin-de-contrat", label: "Solde de tout compte (STC)", icon: FileText, desc: "Calcul du solde de tout compte en fin de contrat" },
      { href: "/declarations", label: "Déclarations sociales", icon: Stamp, desc: "CNPS, ITS, FDFP et autres déclarations légales" },
      { href: "/analyses", label: "Analyse masse salariale", icon: ChartBar, desc: "Coûts et répartition de la masse salariale" },
      { href: "/paie/import-sage", label: "Import Sage Paie", icon: UploadSimple, desc: "Importer les données depuis Sage Paie" },
    ],
  },
  {
    label: "Analytique & Prévisions",
    accent: "#2563eb",
    defaultOpen: false,
    items: [
      { href: "/analytique", label: "Analytique RH", icon: ChartPieSlice, exact: true, desc: "Tableaux de bord et indicateurs RH" },
      { href: "/analytique/focus", label: "Focus stratégique", icon: Target, desc: "Synthèse des points d'attention prioritaires" },
      { href: "/analytique/risque-depart", label: "Risque de départ", icon: UserMinus, desc: "Salariés à risque de démission (turnover)" },
      { href: "/analytique/prevision", label: "Prévision des effectifs", icon: TrendUp, desc: "Projection des effectifs sur l'année à venir" },
      { href: "/analytique/cohortes", label: "Cohortes d'embauche", icon: UsersThree, desc: "Suivi des salariés par année d'arrivée" },
      { href: "/analytique/retraite", label: "Départs en retraite", icon: CalendarBlank, desc: "Salariés approchant l'âge de la retraite" },
    ],
  },
  {
    label: "Documents",
    accent: "#2563eb",
    defaultOpen: false,
    items: [
      { href: "/documents-rh", label: "Documents RH", icon: FilePdf, desc: "Attestations, certificats et modèles" },
      { href: "/ged", label: "Documents numérisés (GED)", icon: Books, pulse: true, desc: "Gestion électronique des documents : tout le coffre-fort documentaire" },
      { href: "/archives", label: "Archives", icon: Archive, desc: "Dossiers clôturés et conservés" },
    ],
  },
  {
    label: "Développement RH",
    accent: "#2563eb",
    defaultOpen: false,
    items: [
      { href: "/recrutement", label: "Recrutement", icon: UserPlus, desc: "Offres d'emploi et candidatures" },
      { href: "/evaluations", label: "Évaluations & Performance", icon: ChartLineUp, desc: "Entretiens et appréciations annuelles" },
      { href: "/formation", label: "Formation & taxe FDFP", icon: Student, desc: "Plan de formation et taxe FDFP" },
    ],
  },
  {
    label: "Qualité & Risques",
    accent: "#2563eb",
    defaultOpen: false,
    items: [
      { href: "/disciplinaire", label: "Procédures disciplinaires", icon: ShieldWarning, desc: "Avertissements, mises à pied et sanctions" },
      { href: "/contentieux", label: "Contentieux", icon: Scales, desc: "Litiges et inspections du travail" },
      { href: "/qhse", label: "QHSE & Accidents", icon: FirstAid, desc: "Qualité, Hygiène, Sécurité, Environnement et accidents du travail" },
      { href: "/duerp", label: "Risques professionnels (DUERP)", icon: ShieldWarning, desc: "Document Unique d'Évaluation des Risques Professionnels" },
      { href: "/bilan-social", label: "Bilan social annuel", icon: Books, desc: "Synthèse sociale obligatoire de l'année" },
    ],
  },
  {
    label: "Reporting & Comms",
    accent: "#2563eb",
    defaultOpen: false,
    items: [
      { href: "/reporting", label: "Reporting RH", icon: Presentation, desc: "Rapports et exports pour la direction" },
      { href: "/messages", label: "Messagerie interne", icon: ChatCircleText, desc: "Échanges avec les collaborateurs" },
      { href: "/notifications", label: "Notifications", icon: Bell, desc: "Alertes et notifications de l'application" },
    ],
  },
  {
    label: "Outils & IA",
    accent: "#2563eb",
    defaultOpen: false,
    items: [
      { href: "/agent-juridique", label: "Agent juridique IA", icon: Robot, desc: "Assistant IA sur le droit du travail ivoirien" },
      { href: "/calculateur", label: "Simulateur de paie", icon: Calculator, desc: "Simuler un salaire net, brut ou un coût employeur" },
    ],
  },
];

function NavLink({
  href,
  label,
  icon: Icon,
  exact = false,
  pulse = false,
  desc,
  accent,
}: NavItem & { accent: string }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      title={desc ?? label}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-amber-500/60",
        isActive
          ? "text-white font-semibold"
          : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
      )}
      style={isActive ? { background: `${accent}25` } : undefined}
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
        className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-amber-500/60"
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
        { href: "/parametres", label: "Paramètres", icon: Gear, exact: true, desc: "Réglages généraux de l'entreprise" },
        { href: "/parametres/workflows", label: "Circuits d'approbation", icon: ChartLineUp, desc: "Définir qui valide les demandes (congés, paie…)" },
        { href: "/parametres/permissions", label: "Rôles & permissions", icon: UsersThree, desc: "Droits d'accès par rôle (RBAC)" },
        { href: "/parametres/delegations", label: "Délégations", icon: UserMinus, desc: "Déléguer ses droits pendant une absence" },
        { href: "/parametres/securite", label: "Sécurité & 2FA", icon: ShieldCheck, desc: "Mot de passe et double authentification" },
        { href: "/parametres/securite-events", label: "Événements de sécurité", icon: ShieldWarning, desc: "Connexions et actions sensibles" },
        { href: "/parametres/audit", label: "Journal d'audit", icon: ShieldWarning, desc: "Historique de toutes les actions" },
        { href: "/parametres/whatsapp", label: "WhatsApp Business", icon: ChatCircleText, desc: "Notifications via WhatsApp" },
        { href: "/parametres/webhooks", label: "Webhooks", icon: Plug, desc: "Connexions automatisées vers d'autres outils" },
        { href: "/parametres/api", label: "API & Clés", icon: Key, desc: "Clés d'accès pour les intégrations" },
        { href: "/paie/mobile-money", label: "Mobile Money CI", icon: DeviceMobile, desc: "Paiement des salaires par Mobile Money" },
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
