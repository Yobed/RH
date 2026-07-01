"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  CaretRight,
  CaretDown,
  Question,
  SquaresFour,
  Users,
  Money,
  Student,
  ChartPieSlice,
  ShieldCheck,
  Robot,
  Gear,
  UserCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

interface GuideItem {
  title: string;
  href: string;
  desc: string;
}
interface GuideModule {
  id: string;
  label: string;
  icon: React.ElementType;
  items: GuideItem[];
}

const MODULES: GuideModule[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: SquaresFour,
    items: [
      { title: "Cockpit RH", href: "/rh", desc: "KPI clés, vigilance prioritaire, modules, actions rapides, graphes. Vues Aperçu / Kanban / Liste / Pivot BI / IA." },
    ],
  },
  {
    id: "people",
    label: "Collaborateurs",
    icon: Users,
    items: [
      { title: "Fiches collaborateurs", href: "/employes", desc: "Registre du personnel : recherche, filtres, fiche complète (identité, contrat, documents, congés, paie, carrière)." },
      { title: "Organigramme", href: "/employes/organigramme", desc: "Structure hiérarchique N+1 ; rattacher un collaborateur existant ou en créer un." },
      { title: "Contrats", href: "/contrats", desc: "CDI, CDD, avenants ; alertes d'expiration sous 30 jours." },
      { title: "Pointage biométrique", href: "/pointage", desc: "Heures, présences, géolocalisation et anomalies." },
      { title: "Absences & Congés", href: "/conges", desc: "Demandes, validation manager → RH, soldes (2,2 j/mois — CT-CI), heatmap, calendrier." },
      { title: "Onboarding", href: "/onboarding", desc: "Parcours d'intégration d'un nouvel arrivant (checklist)." },
      { title: "Offboarding", href: "/offboarding", desc: "Parcours de départ et restitutions." },
      { title: "Planning & Équipes", href: "/planning", desc: "Rotations, shifts ; vue Gantt disponible." },
      { title: "Heures supplémentaires", href: "/heures-sup", desc: "Suivi et majoration des heures sup." },
      { title: "Visites médicales", href: "/medical", desc: "Médecine du travail : aptitudes, périodicité." },
      { title: "Trombinoscope", href: "/employes/photos", desc: "Registre des photos d'identité des salariés." },
    ],
  },
  {
    id: "paie",
    label: "Paie",
    icon: Money,
    items: [
      { title: "Bulletins de paie", href: "/paie", desc: "Édition des bulletins (CNPS, ITS, CMU — barème ivoirien)." },
      { title: "Génération en lot", href: "/paie/generer-lot", desc: "Produire tous les bulletins du mois en une fois." },
      { title: "Bordereau de virement", href: "/paie/bordereau", desc: "Ordre bancaire de paiement." },
      { title: "Anomalies de paie", href: "/paie/anomalies", desc: "Détection des écarts avant validation." },
      { title: "Solde de tout compte", href: "/paie/fin-de-contrat", desc: "STC en fin de contrat (Art. 25.1)." },
      { title: "Déclarations sociales", href: "/declarations", desc: "CNPS, ITS, FDFP." },
      { title: "Masse salariale", href: "/analyses", desc: "Coûts et répartition de la masse salariale." },
      { title: "Mobile Money", href: "/paie/mobile-money", desc: "Virements salaires Orange / Wave / MTN." },
      { title: "Grille salariale", href: "/parametres/grille-salariale", desc: "Référentiel catégoriel (Convention Collective)." },
    ],
  },
  {
    id: "talents",
    label: "Talents",
    icon: Student,
    items: [
      { title: "Recrutement", href: "/recrutement", desc: "Offres, candidatures, scoring IA des CV, pipeline." },
      { title: "Évaluations & Performance", href: "/evaluations", desc: "Entretiens annuels et suivi des KPIs." },
      { title: "Formation & FDFP", href: "/formation", desc: "Plan de formation et taxe FDFP." },
    ],
  },
  {
    id: "analytique",
    label: "Analytique",
    icon: ChartPieSlice,
    items: [
      { title: "Analytique RH", href: "/analytique", desc: "Tableaux de bord BI." },
      { title: "Reporting RH", href: "/reporting", desc: "Rapports et exports." },
      { title: "Calendrier global", href: "/calendrier", desc: "Évènements d'entreprise." },
      { title: "Risque de départ", href: "/analytique/risque-depart", desc: "Score turnover (7 signaux pondérés) avec détail par employé." },
      { title: "Prévision effectifs", href: "/analytique/prevision", desc: "Projection de la masse salariale N+1." },
      { title: "Cohortes d'embauche", href: "/analytique/cohortes", desc: "Rétention par génération de recrutement." },
      { title: "Planning retraite", href: "/analytique/retraite", desc: "Départs à 60 ans et plan de remplacement." },
      { title: "Bilan social", href: "/bilan-social", desc: "Indicateurs sociaux annuels." },
    ],
  },
  {
    id: "conformite",
    label: "Conformité",
    icon: ShieldCheck,
    items: [
      { title: "Procédures disciplinaires", href: "/disciplinaire", desc: "Avertissements, mises à pied, licenciements." },
      { title: "Contentieux", href: "/contentieux", desc: "Litiges et inspections (Loi 2015-532)." },
      { title: "QHSE & Accidents", href: "/qhse", desc: "Sécurité au travail et sinistralité." },
      { title: "DUERP", href: "/duerp", desc: "Document unique d'évaluation des risques pro." },
      { title: "Documents RH", href: "/documents-rh", desc: "Attestations et modèles." },
      { title: "GED", href: "/ged", desc: "Coffre-fort documentaire par employé." },
      { title: "Archives", href: "/archives", desc: "Documents clôturés." },
    ],
  },
  {
    id: "outils",
    label: "Outils",
    icon: Robot,
    items: [
      { title: "Agent juridique IA", href: "/agent-juridique", desc: "Assistant sur le droit du travail ivoirien." },
      { title: "Simulateur de paie", href: "/calculateur", desc: "Calculs Net / Brut, STC, conventions." },
      { title: "Messagerie interne", href: "/messages", desc: "Échanges d'équipe." },
      { title: "Notifications & Alertes", href: "/notifications", desc: "Rappels et échéances." },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    icon: Gear,
    items: [
      { title: "Paramètres généraux", href: "/parametres", desc: "Profil, entreprise, branding." },
      { title: "Circuits d'approbation", href: "/parametres/workflows", desc: "Valideurs et règles d'escalade." },
      { title: "Rôles & Permissions", href: "/parametres/permissions", desc: "Gestion des accès (RBAC) par module." },
      { title: "Sécurité & Audit", href: "/parametres/securite", desc: "Double authentification (2FA) et journal d'audit." },
      { title: "Intégrations", href: "/parametres/whatsapp", desc: "WhatsApp, API REST, webhooks, délégations." },
    ],
  },
  {
    id: "portail",
    label: "Portail salarié",
    icon: UserCircle,
    items: [
      { title: "Espace salarié", href: "/portail", desc: "Self-service : bulletins, congés, attestations, signatures, coffre-fort, profil. Réservé au rôle Collaborateur." },
    ],
  },
];

interface Faq {
  q: string;
  a: React.ReactNode;
}

const FAQS: Faq[] = [
  {
    q: "Quand un employé devient-il « inactif » et comment le réactiver ?",
    a: (
      <>
        <p>Un employé passe en <strong>inactif</strong> lorsqu'il est <strong>archivé</strong>, à la finalisation d'un <strong>solde de tout compte / départ</strong>, via un <strong>import</strong> marqué inactif, ou par <strong>édition manuelle</strong> du statut. (« Suspendu » = suspension temporaire, distincte.)</p>
        <p className="mt-2">Pour le <strong>réactiver</strong> : <Link href="/employes" className="text-[#d67002] underline">Collaborateurs</Link> → onglet <em>Inactifs</em> → ouvrir la fiche → <em>Modifier</em> → champ <strong>Statut = Actif</strong> → Enregistrer.</p>
      </>
    ),
  },
  {
    q: "Comment fonctionne la validation des congés ?",
    a: <p>Le salarié (ou le RH) crée la demande dans <Link href="/conges" className="text-[#d67002] underline">Absences & Congés</Link>. Elle suit le circuit <strong>demande → validation manager → validation RH</strong>. Les soldes s'acquièrent à 2,2 jours/mois travaillé (Code du Travail ivoirien).</p>,
  },
  {
    q: "Quels sont les rôles et leurs accès ?",
    a: <p><strong>Administrateur</strong> et <strong>Responsable RH</strong> : accès complet + administration. <strong>Chargé RH</strong> / <strong>Manager</strong> : périmètre opérationnel et validations. <strong>Collaborateur</strong> : uniquement le <Link href="/portail" className="text-[#d67002] underline">Portail salarié</Link>. Les accès fins se règlent dans <Link href="/parametres/permissions" className="text-[#d67002] underline">Rôles & Permissions</Link>.</p>,
  },
  {
    q: "Comment chercher ou aller vite quelque part ?",
    a: <p>Appuie sur <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold">Ctrl/⌘ + K</kbd> n'importe où pour ouvrir la recherche globale et naviguer rapidement.</p>,
  },
  {
    q: "Mes données sont-elles isolées des autres entreprises ?",
    a: <p>Oui. L'application est <strong>multi-tenant</strong> : chaque donnée est rattachée à votre entreprise et isolée (sécurité au niveau base de données). Vous ne voyez jamais les données d'une autre société.</p>,
  },
];

export default function AidePage() {
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const q = query.trim().toLowerCase();

  const modules = useMemo(() => {
    if (!q) return MODULES;
    return MODULES.map((m) => ({
      ...m,
      items: m.items.filter(
        (it) => it.title.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q) || m.label.toLowerCase().includes(q)
      ),
    })).filter((m) => m.items.length > 0);
  }, [q]);

  const faqs = useMemo(() => {
    if (!q) return FAQS;
    return FAQS.filter((f) => f.q.toLowerCase().includes(q));
  }, [q]);

  const totalItems = MODULES.reduce((s, m) => s + m.items.length, 0);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Centre d'aide"
        eyebrowIcon={<Question size={14} weight="bold" />}
        title="Guide de l'application"
        description={`${MODULES.length} domaines · ${totalItems} pages · droit du travail ivoirien (FCFA)`}
      />

      {/* Recherche */}
      <div className="relative max-w-xl">
        <MagnifyingGlass className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une page, un module, une fonctionnalité…"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-2xs outline-none transition-all focus-visible:border-[#ee7f03] focus-visible:ring-2 focus-visible:ring-[#ee7f03]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">Questions fréquentes</h2>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={f.q}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
                  >
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{f.q}</span>
                    <CaretDown weight="bold" className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modules */}
      {modules.map((m) => {
        const Icon = m.icon;
        return (
          <section key={m.id} className="space-y-3">
            {/* En-tête de module surligné teal */}
            <div className="flex items-center gap-2.5 rounded-lg border border-[#ee7f03]/15 bg-[#ee7f03]/10 px-3 py-2">
              <Icon weight="duotone" className="h-4 w-4 text-[#d67002] dark:text-[#2dd4bf]" />
              <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#d67002] dark:text-[#2dd4bf]">{m.label}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {m.items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="group flex flex-col rounded-2xl border border-slate-200/70 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#ee7f03]/40 hover:shadow-[0_10px_24px_-14px_rgba(238,127,3,0.45)] dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{it.title}</h3>
                    <CaretRight weight="bold" className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#d67002]" />
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">{it.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#d67002] opacity-0 transition-opacity group-hover:opacity-100 dark:text-[#2dd4bf]">
                    Ouvrir <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {modules.length === 0 && faqs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500">Aucun résultat pour « {query} ».</p>
        </div>
      )}
    </PageShell>
  );
}
