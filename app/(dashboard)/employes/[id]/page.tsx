import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import { DocumentUploadDialog } from "@/components/rh/DocumentUploadDialog";
import { DocumentDropdown } from "@/components/rh/DocumentDropdown";
import { CareerTimeline } from "@/components/rh/CareerTimeline";
import { CareerEventDialog } from "@/components/rh/CareerEventDialog";
import { ContractPrintButton } from "@/components/rh/ContractPrintButton";
import {
  User,
  Phone,
  EnvelopeSimple,
  Calendar,
  Briefcase,
  FileText,
  ChartBar,
  ArrowLeft,
  CalendarDots,
  Money,
  TrendUp,
  ClockCounterClockwise,
  FolderOpen,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Link from "next/link";
import { formatAnciennete, calculerPrimeAnciennete } from "@/lib/paie-ci";
import { calculerJoursAcquis, calculerSoldeConges } from "@/lib/conges-ci";
import { EmployeeCostSheet } from "@/components/employees/EmployeeCostSheet";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("employees")
    .select("full_name")
    .eq("id", params.id)
    .single();
  return { title: data ? `${data.full_name} — RH Manager CI` : "Employé introuvable" };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
      <span className="text-xs font-medium text-slate-600 w-36 shrink-0">{label}</span>
      <span className="text-sm text-slate-800">{value ?? <span className="text-slate-300">—</span>}</span>
    </div>
  );
}

function getInitials(name: string): string {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function safeFormatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-CI");
  } catch {
    return "—";
  }
}

type StatutKey = "actif" | "inactif" | "suspendu" | "approuve" | "en_attente" | "refuse";

const statutConfig: Record<StatutKey, { dot: string; bg: string; text: string; label: string }> = {
  actif: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Actif" },
  inactif: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600", label: "Inactif" },
  suspendu: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", label: "Suspendu" },
  approuve: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Approuvé" },
  en_attente: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", label: "En attente" },
  refuse: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600", label: "Refusé" },
};

function StatutBadge({ statut }: { statut: string | null }) {
  const key = (statut ?? "actif") as StatutKey;
  const cfg = statutConfig[key] ?? statutConfig.inactif;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const fmtXOF = (n: number) =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(n);

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const anneeEnCours = new Date().getFullYear();

  const [
    { data: emp },
    { data: contracts },
    { data: evaluations },
    { data: documents },
    { data: conges },
    { data: bulletins },
    { data: salaryHistory },
    { data: leaveBalance },
    { data: congesAnnuelsApprouves },
    { data: careerEvents },
    { data: company },
  ] = await Promise.all([
    supabase.from("employees").select("*").eq("id", params.id).single(),
    supabase.from("contracts").select("id, type_contrat, date_debut, date_fin, salaire_brut, statut, renouvellement_count").eq("employee_id", params.id).order("date_debut", { ascending: false }),
    supabase.from("evaluations").select("id, periodicite, periode, date_evaluation, score_global, statut").eq("employee_id", params.id).order("date_evaluation", { ascending: false }).limit(5),
    supabase.from("documents").select("id, name, famille, file_type, file_size_kb, created_at, file_url").eq("employee_id", params.id).order("created_at", { ascending: false }),
    supabase.from("conges").select("id, type, date_debut, date_fin, nb_jours, statut").eq("employee_id", params.id).order("date_debut", { ascending: false }).limit(5),
    supabase.from("bulletins_paie").select("id, periode, salaire_brut, cnps_salarie, its, salaire_net, statut").eq("employee_id", params.id).order("periode", { ascending: false }).limit(6),
    supabase.from("employee_salary_history").select("id, date_effet, salaire_brut, sursalaire, prime_exceptionnelle, prime_salissure, prime_depassement, prime_fonction, prime_transport, motif, created_at").eq("employee_id", params.id).order("date_effet", { ascending: false }),
    supabase.from("leave_balances").select("jours_acquis, jours_pris, solde, annee").eq("employee_id", params.id).eq("annee", anneeEnCours).single(),
    supabase.from("conges").select("nb_jours").eq("employee_id", params.id).eq("type", "annuel").eq("statut", "approuve").gte("date_debut", `${anneeEnCours}-01-01`).lte("date_debut", `${anneeEnCours}-12-31`),
    supabase.from("career_events").select("*").eq("employee_id", params.id).order("date_event", { ascending: false }),
    supabase.from("companies").select("*").single(),
  ]);

  if (!emp) notFound();

  const anciennete = formatAnciennete(emp.date_embauche);
  const joursPrisAnnee = (congesAnnuelsApprouves ?? []).reduce((acc, c) => acc + c.nb_jours, 0);
  const joursAcquisCalc = leaveBalance?.jours_acquis ?? calculerJoursAcquis(emp.date_embauche, anneeEnCours);
  const jours_pris_final = leaveBalance?.jours_pris ?? joursPrisAnnee;
  const soldeCalc = leaveBalance?.solde ?? calculerSoldeConges(joursAcquisCalc, jours_pris_final);

  return (
    <div className="p-6 md:p-8 space-y-6 bg-transparent">
      {/* Navigation retour */}
      <Link
        href="/employes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-700 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" weight="bold" />
        Retour à la liste
      </Link>

      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar initiales */}
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold"
              style={{ background: "oklch(0.175 0.04 248)", color: "oklch(0.78 0.13 73)" }}
            >
              {getInitials(emp.full_name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{emp.full_name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-slate-600 font-medium">{emp.poste}</span>
                {emp.departement && (
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {emp.departement}
                  </span>
                )}
                <StatutBadge statut={emp.statut} />
              </div>
              <p className="text-xs text-slate-600 mt-1.5 font-mono tabular-nums">
                {emp.matricule} · {anciennete}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <DocumentDropdown employee={emp} company={company} />
            <EmployeeDialog employee={emp} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="bg-slate-100/70 p-1 rounded-xl w-fit">
          <TabsTrigger value="summary" className="gap-2 rounded-lg px-4 text-sm">
            <ClockCounterClockwise className="h-4 w-4" />
            <span className="hidden sm:inline">Parcours</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-2 rounded-lg px-4 text-sm">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Contrats & Salaire</span>
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2 rounded-lg px-4 text-sm">
            <CalendarDots className="h-4 w-4" />
            <span className="hidden sm:inline">Congés</span>
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2 rounded-lg px-4 text-sm">
            <Money className="h-4 w-4" />
            <span className="hidden sm:inline">Paie</span>
          </TabsTrigger>
          <TabsTrigger value="ged" className="gap-2 rounded-lg px-4 text-sm">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">GED</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Parcours */}
        <TabsContent value="summary" className="space-y-6 pt-2">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Identité */}
              <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5 space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600 border-b border-slate-100 pb-3">
                  <User className="h-3.5 w-3.5" weight="bold" />
                  Identité & Contacts
                </h3>
                <div className="grid gap-y-3 sm:grid-cols-2">
                  <InfoRow label="Matricule" value={<span className="font-mono tabular-nums text-xs">{emp.matricule}</span>} />
                  <InfoRow
                    label="Email"
                    value={
                      emp.email ? (
                        <a href={`mailto:${emp.email}`} className="hover:underline text-[oklch(0.175_0.04_248)]">
                          {emp.email}
                        </a>
                      ) : null
                    }
                  />
                  <InfoRow
                    label="Téléphone"
                    value={
                      emp.phone ? (
                        <a href={`tel:${emp.phone}`} className="hover:underline">
                          {emp.phone}
                        </a>
                      ) : null
                    }
                  />
                  <InfoRow label="Genre" value={emp.genre === "M" ? "Masculin" : emp.genre === "F" ? "Féminin" : null} />
                  <InfoRow
                    label="Date de naissance"
                    value={safeFormatDate(emp.date_naissance)}
                  />
                  <InfoRow label="Nationalité" value={emp.nationalite} />
                  <InfoRow label="État civil" value={emp.etat_civil} />
                  <InfoRow label="Enfants à charge" value={emp.nb_enfants} />
                </div>
              </div>

              {/* Parcours professionnel */}
              <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
                    <TrendUp className="h-3.5 w-3.5" weight="bold" />
                    Parcours Professionnel
                  </h3>
                  <CareerEventDialog employeeId={emp.id} companyId={emp.company_id} />
                </div>
                <CareerTimeline events={careerEvents || []} />
              </div>
            </div>

            {/* Colonne droite */}
            <div className="space-y-6">
              {/* Évaluations */}
              <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600 border-b border-slate-100 pb-3 mb-4">
                  <ChartBar className="h-3.5 w-3.5" weight="bold" />
                  Performance
                </h3>
                {!evaluations || evaluations.length === 0 ? (
                  <p className="text-sm text-slate-600 text-center py-8">Aucune évaluation.</p>
                ) : (
                  <div className="space-y-2">
                    {evaluations.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-slate-100 p-3 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-sm text-slate-800">{ev.periode}</p>
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 font-mono tabular-nums">
                            {ev.score_global}/100
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {safeFormatDate(ev.date_evaluation)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Contrats */}
        <TabsContent value="contracts" className="space-y-6 pt-2">
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
                <FileText className="h-3.5 w-3.5" weight="bold" />
                Historique des contrats
              </h3>
            </div>
            {!contracts || contracts.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-600 italic">Aucun contrat.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Type</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Période</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Salaire brut</th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Statut</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{c.type_contrat}</span>
                          {(c.renouvellement_count ?? 0) > 0 && (
                            <span className="text-[10px] text-slate-600">{c.renouvellement_count} renouvs.</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono tabular-nums text-xs">
                        {safeFormatDate(c.date_debut)} → {c.date_fin ? safeFormatDate(c.date_fin) : "Indét."}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-medium text-slate-800">
                        {fmtXOF(c.salaire_brut)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatutBadge statut={c.statut} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ContractPrintButton employee={emp} contract={c} company={company} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Historique Salaire */}
            <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                  Historique éléments salaire
                </h3>
              </div>
              <div className="max-h-[300px] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/60 sticky top-0 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Date</th>
                      <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Salaire brut</th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Motif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salaryHistory?.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-2 text-slate-600">
                          {safeFormatDate(h.date_effet)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums font-medium text-slate-800">
                          {new Intl.NumberFormat("fr-CI").format(h.salaire_brut)}
                        </td>
                        <td className="px-4 py-2 text-slate-600 italic truncate max-w-[150px]">
                          {h.motif ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Coût employeur */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600 pl-1">
                <TrendUp className="h-3.5 w-3.5 text-amber-500" weight="bold" />
                Détail charges patronales
              </h3>
              <EmployeeCostSheet
                salaireBrut={emp.salaire_brut ?? 0}
                sursalaire={emp.sursalaire}
                primeExceptionnelle={emp.prime_exceptionnelle}
                primeSalissure={emp.prime_salissure}
                primeDepassement={emp.prime_depassement}
                primeFonction={emp.prime_fonction}
                primeTransport={emp.prime_transport}
                primeAnciennete={calculerPrimeAnciennete(emp.salaire_brut ?? 0, emp.date_embauche)}
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab: Congés */}
        <TabsContent value="leaves" className="space-y-6 pt-2">
          <div className="grid gap-6 md:grid-cols-4">
            {/* Solde */}
            <div className="md:col-span-1">
              <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5 text-center space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Solde annuel {anneeEnCours} <span className="text-slate-400 font-normal ml-2"> (2,2 j/mois)</span>
                </p>
                <div className="py-2">
                  <span className={`text-5xl font-black font-mono tabular-nums ${soldeCalc > 5 ? "text-emerald-600" : "text-amber-600"}`}>
                    {soldeCalc.toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-slate-600 ml-1">jours</span>
                </div>
                <div className="border-t border-slate-100 pt-4 grid grid-cols-2 text-xs divide-x divide-slate-100">
                  <div>
                    <p className="text-slate-600 mb-1">Acquis</p>
                    <p className="font-bold font-mono tabular-nums text-slate-800">{joursAcquisCalc.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Pris</p>
                    <p className="font-bold font-mono tabular-nums text-amber-600">{jours_pris_final.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Congés récents */}
            <div className="md:col-span-3 rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-600">Congés récents</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Type</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Période</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Jours</th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {conges?.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-700 capitalize">{c.type}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono tabular-nums text-xs">
                        {safeFormatDate(c.date_debut)} → {safeFormatDate(c.date_fin)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold font-mono tabular-nums text-slate-800">{c.nb_jours}j</td>
                      <td className="px-4 py-3 text-center">
                        <StatutBadge statut={c.statut} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Paie */}
        <TabsContent value="payroll" className="space-y-6 pt-2">
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
                <Money className="h-3.5 w-3.5 text-emerald-600" weight="bold" />
                Bulletins de paie
              </h3>
            </div>
            {!bulletins || bulletins.length === 0 ? (
              <div className="p-12 text-center text-slate-600 italic text-sm">Aucun bulletin généré.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Période</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Brut</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Cotisations</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Net</th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bulletins.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono tabular-nums font-medium text-slate-700">{b.periode}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                        {new Intl.NumberFormat("fr-CI").format(b.salaire_brut)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-red-500">
                        −{new Intl.NumberFormat("fr-CI").format((b.cnps_salarie ?? 0) + (b.its ?? 0))}
                      </td>
                      <td className="px-4 py-3 text-right font-bold font-mono tabular-nums text-emerald-700">
                        {new Intl.NumberFormat("fr-CI").format(b.salaire_net)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatutBadge statut={b.statut} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Tab: GED */}
        <TabsContent value="ged" className="space-y-6 pt-2">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Conformité légale */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600 border-b border-slate-100 pb-3">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" weight="bold" />
                Conformité Légale
              </h3>
              {(() => {
                const REQUIS = ["CNI / Passeport", "Extrait de naissance", "Contrat", "CV", "Diplômes"];
                const presentsArr = documents?.map((d) => d.famille) ?? [];
                return (
                  <div className="space-y-2">
                    {REQUIS.map((r) => {
                      const has = presentsArr.includes(r);
                      return (
                        <div
                          key={r}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold border ${
                            has
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-red-50 text-red-600 border-red-100"
                          }`}
                        >
                          <span>{r}</span>
                          <span>{has ? "✓" : "✗"}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Documents */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
                  <FolderOpen className="h-3.5 w-3.5" weight="bold" />
                  Documents archivés
                </h3>
                <DocumentUploadDialog employeeId={emp.id} companyId={emp.company_id} />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
                {!documents || documents.length === 0 ? (
                  <p className="p-10 text-center text-sm text-slate-600 italic">Espace documentaire vide.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/60 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Nom du document</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Catégorie</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Date</th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">{doc.name}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {doc.famille ?? "GED"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs">
                            {safeFormatDate(doc.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[oklch(0.175_0.04_248)] hover:underline font-semibold text-xs"
                            >
                              Télécharger
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
