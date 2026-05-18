export const dynamic = "force-dynamic";
export const metadata = { title: "Bienvenue — RH Manager CI" };

import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import {
  Users, FileText, CalendarBlank, Money, ChartPieSlice, Robot,
  ShieldCheck, GraduationCap, FolderOpen, Scales, ClipboardText,
  Lightning, BookOpen, Sparkle, ArrowRight, CheckCircle, Stethoscope,
  Bell, Clock,
} from "@phosphor-icons/react/dist/ssr";

interface ModuleCard {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; weight?: "regular" | "fill" | "bold" | "duotone" }>;
  color: string;
  ringColor: string;
}

const MODULES: ModuleCard[] = [
  {
    href: "/employes",
    label: "Collaborateurs",
    description: "Fiches employés, contrats, historique de carrière, organigramme dynamique.",
    icon: Users,
    color: "from-sky-500 to-blue-600",
    ringColor: "ring-sky-100",
  },
  {
    href: "/contrats",
    label: "Contrats & Avenants",
    description: "CDI, CDD, stages, conventions — édition assistée + signature électronique.",
    icon: FileText,
    color: "from-indigo-500 to-violet-600",
    ringColor: "ring-indigo-100",
  },
  {
    href: "/paie",
    label: "Paie & Bulletins",
    description: "Calcul ITS / CNPS / CMU, sursalaire inverse, primes contrat, exports Sage.",
    icon: Money,
    color: "from-emerald-500 to-green-600",
    ringColor: "ring-emerald-100",
  },
  {
    href: "/conges",
    label: "Absences & Congés",
    description: "Soldes 2,75 j/mois (loi 2026), validation workflow, heatmap équipe.",
    icon: CalendarBlank,
    color: "from-amber-500 to-orange-600",
    ringColor: "ring-amber-100",
  },
  {
    href: "/ged",
    label: "GED — Dossiers numériques",
    description: "Classement par famille, complétude réglementaire, analyse IA des documents.",
    icon: FolderOpen,
    color: "from-fuchsia-500 to-pink-600",
    ringColor: "ring-fuchsia-100",
  },
  {
    href: "/recrutement",
    label: "Recrutement",
    description: "Postes, candidats, scoring CV par Claude, suivi pipeline.",
    icon: ClipboardText,
    color: "from-cyan-500 to-teal-600",
    ringColor: "ring-cyan-100",
  },
  {
    href: "/formation",
    label: "Formation & FDFP",
    description: "Plan annuel, déclarations FDFP, suivi présences et évaluations.",
    icon: GraduationCap,
    color: "from-purple-500 to-indigo-600",
    ringColor: "ring-purple-100",
  },
  {
    href: "/medical",
    label: "Santé au travail",
    description: "Visites médicales, restrictions d'aptitude, accidents du travail.",
    icon: Stethoscope,
    color: "from-rose-500 to-red-600",
    ringColor: "ring-rose-100",
  },
  {
    href: "/duerp",
    label: "DUERP & QHSE",
    description: "Document unique, évaluation des risques, plan d'action.",
    icon: ShieldCheck,
    color: "from-slate-600 to-slate-800",
    ringColor: "ring-slate-100",
  },
  {
    href: "/declarations",
    label: "Déclarations sociales",
    description: "DISA, CNPS, CMU, ITS — export conforme + suivi des dépôts.",
    icon: Scales,
    color: "from-blue-600 to-indigo-700",
    ringColor: "ring-blue-100",
  },
  {
    href: "/analytique",
    label: "Analytique RH",
    description: "Turnover, masse salariale, risque de départ, prévision N+1.",
    icon: ChartPieSlice,
    color: "from-teal-500 to-emerald-600",
    ringColor: "ring-teal-100",
  },
  {
    href: "/agent-juridique",
    label: "Assistant juridique IA",
    description: "Q/R sur le Code du Travail CI 2015-532 et la CCNI — réponses sourcées.",
    icon: Robot,
    color: "from-violet-600 to-fuchsia-700",
    ringColor: "ring-violet-100",
  },
];

interface QuickStart {
  title: string;
  href: string;
  done: boolean;
  hint: string;
}

export default async function BienvenuePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user?.id ?? "")
    .single();

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  const cid = companyId as string | null;

  const { data: company } = cid
    ? await supabase
        .from("companies")
        .select("nom, logo_url, secteur, effectif_cible")
        .eq("id", cid)
        .single()
    : { data: null };

  const [
    { count: nbEmployes },
    { count: nbContrats },
    { count: nbDocuments },
    { count: nbCongesEnAttente },
  ] = await Promise.all([
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("company_id", cid ?? ""),
    supabase.from("contracts").select("id", { count: "exact", head: true }).eq("company_id", cid ?? ""),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("company_id", cid ?? ""),
    supabase
      .from("conges")
      .select("id", { count: "exact", head: true })
      .eq("company_id", cid ?? "")
      .eq("statut", "en_attente"),
  ]);

  const quickStart: QuickStart[] = [
    {
      title: "Compléter le profil entreprise",
      href: "/parametres/entreprise",
      done: !!company?.nom && !!company?.secteur,
      hint: "Raison sociale, secteur, logo, couleurs.",
    },
    {
      title: "Ajouter vos collaborateurs",
      href: "/employes",
      done: (nbEmployes ?? 0) > 0,
      hint: "Import CSV ou saisie manuelle, multi-tenant via RLS.",
    },
    {
      title: "Enregistrer les contrats en cours",
      href: "/contrats",
      done: (nbContrats ?? 0) > 0,
      hint: "Type, durée, salaire brut, primes, période d'essai.",
    },
    {
      title: "Archiver les documents obligatoires",
      href: "/ged",
      done: (nbDocuments ?? 0) > 0,
      hint: "CNI, contrat, CV, casier, certificat médical.",
    },
    {
      title: "Paramétrer la paie",
      href: "/paie/parametres",
      done: false,
      hint: "Périodes, cotisations, conventions collectives.",
    },
  ];

  const greeting = profile?.full_name
    ? profile.full_name.split(/\s+/)[0]
    : user?.email?.split("@")[0] ?? "Administrateur";

  const completedSteps = quickStart.filter((s) => s.done).length;
  const totalSteps = quickStart.length;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="mx-auto max-w-5xl px-6 md:px-8 pb-16 pt-2 space-y-10">
      {/* En-tête */}
      <header className="space-y-3">
        <div className="text-5xl select-none" aria-hidden>👋</div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Bonjour {greeting},
        </h1>
        <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
          Bienvenue sur <span className="font-semibold text-indigo-700">RH Manager CI</span> —
          la plateforme RH conçue pour les entreprises ivoiriennes. Centralisez vos collaborateurs,
          paies, congés et déclarations, en conformité avec le{" "}
          <span className="font-semibold">Code du Travail (Loi 2015-532)</span> et la{" "}
          <span className="font-semibold">CCNI</span>.
        </p>
      </header>

      {/* Démarrage rapide */}
      <section className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <Lightning className="h-5 w-5 text-white" weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Se lancer</h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {completedSteps} sur {totalSteps} étapes terminées
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-indigo-600 leading-none">{progressPct}%</p>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-1">
              configuré
            </p>
          </div>
        </div>

        <div className="h-1.5 w-full rounded-full bg-white/70 overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ul className="space-y-2">
          {quickStart.map((step) => (
            <li key={step.title}>
              <Link
                href={step.href}
                className="group flex items-center gap-3 rounded-xl bg-white px-4 py-3 border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div
                  className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${
                    step.done
                      ? "bg-emerald-500 text-white"
                      : "border-2 border-slate-200 bg-white"
                  }`}
                >
                  {step.done && <CheckCircle className="h-3.5 w-3.5" weight="fill" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold leading-tight ${
                      step.done
                        ? "text-slate-400 line-through decoration-1"
                        : "text-slate-800 group-hover:text-indigo-700"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.hint}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* État du SaaS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill label="Collaborateurs" value={nbEmployes ?? 0} icon={Users} accent="text-sky-600 bg-sky-50" />
        <StatPill label="Contrats actifs" value={nbContrats ?? 0} icon={FileText} accent="text-indigo-600 bg-indigo-50" />
        <StatPill label="Documents GED" value={nbDocuments ?? 0} icon={FolderOpen} accent="text-fuchsia-600 bg-fuchsia-50" />
        <StatPill
          label="Congés à valider"
          value={nbCongesEnAttente ?? 0}
          icon={Bell}
          accent={(nbCongesEnAttente ?? 0) > 0 ? "text-amber-600 bg-amber-50" : "text-slate-500 bg-slate-50"}
        />
      </section>

      {/* Découvrir les modules */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">Découvrir les modules</h2>
            <p className="text-sm text-slate-500 mt-1">
              Cliquez sur une carte pour entrer dans le module correspondant.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`group relative rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_28px_-4px_rgba(99,102,241,0.18)] hover:border-indigo-200 transition-all duration-200 hover:-translate-y-0.5`}
              >
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-sm mb-3 ring-4 ${m.ringColor}`}>
                  <Icon className="h-5 w-5 text-white" weight="fill" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-tight">
                  {m.label}
                </h3>
                <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">
                  {m.description}
                </p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-indigo-500" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Astuces & ressources */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Sparkle className="h-4 w-4 text-amber-600" weight="fill" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Astuces IA</h3>
          </div>
          <ul className="space-y-2 text-[13px] text-slate-600 leading-relaxed">
            <li className="flex gap-2"><span className="text-indigo-500 shrink-0">▸</span><span>Dans la <strong>GED</strong>, cliquez sur « Aperçu » d'un document puis « Analyser avec l'IA » — Claude extrait automatiquement les champs (dates, numéros, salaire).</span></li>
            <li className="flex gap-2"><span className="text-indigo-500 shrink-0">▸</span><span>Le <strong>scoring CV</strong> du recrutement utilise Claude Sonnet pour classer les candidats.</span></li>
            <li className="flex gap-2"><span className="text-indigo-500 shrink-0">▸</span><span>L'<strong>agent juridique</strong> répond en citant le Code du Travail CI grâce au RAG pgvector.</span></li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-blue-600" weight="fill" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Raccourcis utiles</h3>
          </div>
          <ul className="space-y-2 text-[13px] text-slate-600 leading-relaxed">
            <li className="flex items-center gap-2"><kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600">Ctrl K</kbd><span>Ouvrir la palette de commandes.</span></li>
            <li className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-slate-400" /><span>Les <Link href="/rappels" className="text-indigo-600 font-semibold hover:underline">rappels & échéances</Link> centralisent contrats, visites, congés.</span></li>
            <li className="flex items-center gap-2"><ChartPieSlice className="h-3.5 w-3.5 text-slate-400" /><span><Link href="/analytique" className="text-indigo-600 font-semibold hover:underline">L'analytique RH</Link> calcule turnover, masse salariale, risque de départ.</span></li>
          </ul>
        </div>
      </section>

      {/* Pied — conformité */}
      <footer className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 text-center">
        <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-1">
          Conformité légale
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          RH Manager CI est aligné avec le <strong>Code du Travail ivoirien (Loi n° 2015-532)</strong>,
          la <strong>Convention Collective Interprofessionnelle</strong>, et les barèmes <strong>CNPS / CMU / ITS</strong>.
          Devise FCFA (XOF) — fuseau Africa/Abidjan.
        </p>
      </footer>
    </div>
  );
}

function StatPill({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; weight?: "regular" | "fill" | "bold" }>;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="h-4 w-4" weight="fill" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">
          {label}
        </p>
        <p className="text-xl font-bold text-slate-800 mt-1 leading-none">{value}</p>
      </div>
    </div>
  );
}
