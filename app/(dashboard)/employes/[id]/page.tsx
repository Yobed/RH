import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import { DocumentUploadDialog } from "@/components/rh/DocumentUploadDialog";
import { DocumentDropdown } from "@/components/rh/DocumentDropdown";
import { CareerTimeline } from "@/components/rh/CareerTimeline";
import { CareerEventDialog } from "@/components/rh/CareerEventDialog";
import { ContractPrintButton } from "@/components/rh/ContractPrintButton";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  FileText,
  BarChart2,
  ArrowLeft,
  CalendarDays,
  Banknote,
  TrendingUp,
  History,
  GraduationCap,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Link from "next/link";
import { formatAnciennete, calculerPrimeAnciennete } from "@/lib/paie-ci";
import { calculerJoursAcquis, calculerSoldeConges } from "@/lib/conges-ci";
import { scoreLabel } from "@/lib/utils-rh";
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
      <span className="text-xs font-medium text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="text-sm">{value ?? <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const anneeEnCours = new Date().getFullYear();

  const [{ data: emp }, { data: contracts }, { data: evaluations }, { data: documents }, { data: conges }, { data: bulletins }, { data: salaryHistory }, { data: leaveBalance }, { data: congesAnnuelsApprouves }, { data: careerEvents }, { data: company }] = await Promise.all([
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
    <div className="p-6 space-y-6">
      {/* Navigation */}
      <Link href="/employes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Retour à la liste
      </Link>

      {/* Hero Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 text-primary border border-primary/10">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{emp.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base text-muted-foreground font-medium">{emp.poste}</span>
              {emp.departement && (
                <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">
                  {emp.departement}
                </Badge>
              )}
              <Badge variant={emp.statut === "actif" ? "default" : "secondary"} className={emp.statut === "actif" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                {emp.statut ?? "actif"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <DocumentDropdown employee={emp} company={company} />
          <EmployeeDialog employee={emp} />
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-fit">
          <TabsTrigger value="summary" className="gap-2 rounded-lg px-4">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Parcours</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-2 rounded-lg px-4">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Contrats & Salaire</span>
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2 rounded-lg px-4">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Congés</span>
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2 rounded-lg px-4">
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">Paie</span>
          </TabsTrigger>
          <TabsTrigger value="ged" className="gap-2 rounded-lg px-4">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">GED</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Summary */}
        <TabsContent value="summary" className="space-y-6 pt-2">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Identité */}
              <div className="rounded-xl border bg-white p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                  <User className="h-4 w-4 text-primary" />
                  Identité & Contacts
                </h3>
                <div className="grid gap-y-3 sm:grid-cols-2">
                  <InfoRow label="Matricule" value={<span className="font-mono text-xs">{emp.matricule}</span>} />
                  <InfoRow label="Email" value={emp.email ? <a href={`mailto:${emp.email}`} className="text-primary hover:underline">{emp.email}</a> : null} />
                  <InfoRow label="Téléphone" value={emp.phone ? <a href={`tel:${emp.phone}`} className="hover:underline">{emp.phone}</a> : null} />
                  <InfoRow label="Genre" value={emp.genre === "M" ? "Masculin" : emp.genre === "F" ? "Féminin" : null} />
                  <InfoRow label="Date de naissance" value={emp.date_naissance ? new Date(emp.date_naissance).toLocaleDateString("fr-CI") : null} />
                  <InfoRow label="Nationalité" value={emp.nationalite} />
                  <InfoRow label="État civil" value={emp.etat_civil} />
                  <InfoRow label="Enfants à charge" value={emp.nb_enfants} />
                </div>
              </div>

              {/* Suivi de Carrière */}
              <div className="rounded-xl border bg-white p-5">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Parcours Professionnel
                  </h3>
                  <CareerEventDialog employeeId={emp.id} companyId={emp.company_id} />
                </div>
                <CareerTimeline events={careerEvents || []} />
              </div>
            </div>

            <div className="space-y-6">
              {/* Évaluations */}
              <div className="rounded-xl border bg-white p-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2 mb-4">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Performance
                </h3>
                {!evaluations || evaluations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune évaluation.</p>
                ) : (
                  <div className="space-y-3">
                    {evaluations.map((ev) => (
                      <div key={ev.id} className="rounded-lg border p-3 hover:bg-muted/10 transition-colors">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-sm">{ev.periode}</p>
                          <Badge variant="outline" className="text-[10px] leading-3 py-0 h-4">
                            {ev.score_global}/100
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(ev.date_evaluation).toLocaleDateString("fr-CI")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Contracts */}
        <TabsContent value="contracts" className="space-y-6 pt-2">
          {/* Contrats */}
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="p-5 border-b bg-muted/20">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Historique des contrats
              </h3>
            </div>
            {!contracts || contracts.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground italic">Aucun contrat.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Période</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Salaire brut</th>
                    <th className="px-5 py-3 text-center font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Statut</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs sm:text-sm">
                  {contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">{c.type_contrat}</span>
                          {(c.renouvellement_count ?? 0) > 0 && <span className="text-[10px] text-muted-foreground">{c.renouvellement_count} renouvs.</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(c.date_debut).toLocaleDateString("fr-CI")} → {c.date_fin ? new Date(c.date_fin).toLocaleDateString("fr-CI") : "Indét."}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-medium">
                        {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(c.salaire_brut)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge variant={c.statut === "actif" ? "default" : "secondary"}>{c.statut}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
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
            <div className="rounded-xl border bg-white overflow-hidden">
               <div className="p-4 border-b">
                 <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">Historique Éléments Salaire</h3>
               </div>
               <div className="max-h-[300px] overflow-auto">
                 <table className="w-full text-xs">
                    <thead className="bg-muted/20 sticky top-0 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-right">Salaire Brut</th>
                        <th className="px-4 py-2 text-left">Motif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {salaryHistory?.map((h) => (
                        <tr key={h.id} className="hover:bg-muted/5">
                          <td className="px-4 py-2">{new Date(h.date_effet).toLocaleDateString("fr-CI")}</td>
                          <td className="px-4 py-2 text-right font-mono font-medium">
                            {new Intl.NumberFormat("fr-CI").format(h.salaire_brut)}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground italic truncate max-w-[150px]">{h.motif ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>

            {/* Coût Employeur */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 pl-1">
                <TrendingUp className="h-4 w-4 text-amber-500" />
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

        {/* Tab: Leaves */}
        <TabsContent value="leaves" className="space-y-6 pt-2">
          <div className="grid gap-6 md:grid-cols-4">
             <div className="md:col-span-1 space-y-6">
                <div className="rounded-xl border bg-white p-5 text-center space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Solde annuel {anneeEnCours}</p>
                  <div className="py-2">
                    <span className={`text-5xl font-black ${soldeCalc > 5 ? "text-emerald-600" : "text-amber-600"}`}>
                      {soldeCalc.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground ml-1">jours</span>
                  </div>
                  <div className="border-t pt-4 grid grid-cols-2 text-xs divide-x">
                    <div><p className="text-muted-foreground mb-1">Acquis</p><p className="font-bold">{joursAcquisCalc.toFixed(1)}</p></div>
                    <div><p className="text-muted-foreground mb-1">Pris</p><p className="font-bold text-amber-600">{jours_pris_final.toFixed(1)}</p></div>
                  </div>
                </div>
             </div>

             <div className="md:col-span-3 rounded-xl border bg-white overflow-hidden">
                <div className="p-4 border-b bg-muted/10">
                  <h3 className="text-sm font-semibold">Congés récents</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/5">
                    <tr><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-left">Période</th><th className="px-4 py-2 text-right">Jours</th><th className="px-4 py-2 text-center">Statut</th></tr>
                  </thead>
                  <tbody className="divide-y text-xs sm:text-sm">
                    {conges?.map(c => (
                      <tr key={c.id}>
                        <td className="px-4 py-3">{c.type}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-[10px]">{new Date(c.date_debut).toLocaleDateString("fr-CI")} → {new Date(c.date_fin).toLocaleDateString("fr-CI")}</td>
                        <td className="px-4 py-3 text-right font-bold">{c.nb_jours}j</td>
                        <td className="px-4 py-3 text-center"><Badge variant={c.statut === "approuve" ? "default" : "outline"}>{c.statut}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </TabsContent>

        {/* Tab: Payroll */}
        <TabsContent value="payroll" className="space-y-6 pt-2">
          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                Liste des bulletins de paie
              </h3>
            </div>
            {!bulletins || bulletins.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic text-sm">Aucun bulletin généré.</div>
            ) : (
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-muted/20 border-b">
                   <tr>
                     <th className="px-5 py-3 text-left">Période</th>
                     <th className="px-5 py-3 text-right">Brut</th>
                     <th className="px-5 py-3 text-right">Cotisations</th>
                     <th className="px-5 py-3 text-right">Salaire Net</th>
                     <th className="px-5 py-3 text-center">Statut</th>
                   </tr>
                </thead>
                <tbody className="divide-y">
                   {bulletins.map(b => (
                     <tr key={b.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-5 py-4 font-mono font-medium">{b.periode}</td>
                        <td className="px-5 py-4 text-right">{new Intl.NumberFormat("fr-CI").format(b.salaire_brut)}</td>
                        <td className="px-5 py-4 text-right text-red-500">−{new Intl.NumberFormat("fr-CI").format((b.cnps_salarie ?? 0) + (b.its ?? 0))}</td>
                        <td className="px-5 py-4 text-right font-bold text-emerald-700">{new Intl.NumberFormat("fr-CI").format(b.salaire_net)}</td>
                        <td className="px-5 py-4 text-center"><Badge variant="outline">{b.statut}</Badge></td>
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
            {/* Checklist */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Conformité Légale
              </h3>
              {(() => {
                const REQUIS = ["CNI / Passeport", "Extrait de naissance", "Contrat", "CV", "Diplômes"];
                const presentsArr = documents?.map(d => d.famille) ?? [];
                return (
                  <div className="space-y-2">
                    {REQUIS.map(r => {
                      const has = presentsArr.includes(r);
                      return (
                        <div key={r} className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium border ${has ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                           <span>{r}</span>
                           <span>{has ? "✓" : "✗"}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Document List */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Tous les documents archivés
                </h3>
                <DocumentUploadDialog employeeId={emp.id} companyId={emp.company_id} />
              </div>
              <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
                {!documents || documents.length === 0 ? (
                  <p className="p-10 text-center text-sm text-muted-foreground italic">Espace documentaire vide.</p>
                ) : (
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-muted/10 border-b">
                       <tr>
                         <th className="px-5 py-3 text-left">Nom du document</th>
                         <th className="px-5 py-3 text-left">Catégorie</th>
                         <th className="px-5 py-3 text-left">Date</th>
                         <th className="px-5 py-3 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y">
                       {documents.map(doc => (
                         <tr key={doc.id} className="hover:bg-muted/5 transition-colors">
                            <td className="px-5 py-4 font-medium max-w-[200px] truncate">{doc.name}</td>
                            <td className="px-5 py-4"><Badge variant="secondary" className="text-[10px] font-normal">{doc.famille ?? "GED"}</Badge></td>
                            <td className="px-5 py-4 text-muted-foreground">{new Date(doc.created_at!).toLocaleDateString("fr-CI")}</td>
                            <td className="px-5 py-4 text-right">
                               <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Télécharger</a>
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

