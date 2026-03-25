import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import { DocumentUploadDialog } from "@/components/rh/DocumentUploadDialog";
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
} from "lucide-react";
import Link from "next/link";

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

function formatAnciennete(dateEmbauche: string): string {
  const debut = new Date(dateEmbauche);
  const now = new Date();

  let years = now.getFullYear() - debut.getFullYear();
  let months = now.getMonth() - debut.getMonth();
  let days = now.getDate() - debut.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const y = String(years).padStart(2, "0");
  const m = String(months).padStart(2, "0");
  const d = String(days).padStart(2, "0");
  return `${y} an${years > 1 ? "s" : ""} ${m} mois ${d} jour${days > 1 ? "s" : ""}`;
}

function scoreLabel(score: number | null): string {
  if (score === null) return "Non noté";
  if (score >= 90) return "Exceptionnel";
  if (score >= 75) return "Très satisfaisant";
  if (score >= 60) return "Satisfaisant";
  if (score >= 40) return "À améliorer";
  return "Insuffisant";
}

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const [{ data: emp }, { data: contracts }, { data: evaluations }, { data: documents }, { data: conges }, { data: bulletins }] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "id, matricule, full_name, poste, departement, type_contrat, date_embauche, statut, genre, date_naissance, email, phone, salaire_brut, manager_id, company_id, created_at, civilite, nationalite, etat_civil, nb_enfants, niveau_etude, categorie"
      )
      .eq("id", params.id)
      .single(),
    supabase
      .from("contracts")
      .select("id, type_contrat, date_debut, date_fin, salaire_brut, statut, renouvellement_count")
      .eq("employee_id", params.id)
      .order("date_debut", { ascending: false }),
    supabase
      .from("evaluations")
      .select("id, periodicite, periode, date_evaluation, score_global, statut")
      .eq("employee_id", params.id)
      .order("date_evaluation", { ascending: false })
      .limit(5),
    supabase
      .from("documents")
      .select("id, name, famille, file_type, file_size_kb, created_at, file_url")
      .eq("employee_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("conges")
      .select("id, type, date_debut, date_fin, nb_jours, statut")
      .eq("employee_id", params.id)
      .order("date_debut", { ascending: false })
      .limit(5),
    supabase
      .from("bulletins_paie")
      .select("id, periode, salaire_brut, cnps_salarie, its, salaire_net, statut")
      .eq("employee_id", params.id)
      .order("periode", { ascending: false })
      .limit(6),
  ]);

  if (!emp) notFound();

  const anciennete = formatAnciennete(emp.date_embauche);

  return (
    <div className="p-6 space-y-6">
      {/* Navigation */}
      <Link
        href="/employes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la liste
      </Link>

      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{emp.full_name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-muted-foreground">{emp.poste}</span>
              {emp.departement && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{emp.departement}</span>
                </>
              )}
              <Badge variant={emp.statut === "actif" ? "default" : "secondary"}>
                {emp.statut ?? "actif"}
              </Badge>
            </div>
          </div>
        </div>
        <EmployeeDialog employee={emp} />
      </div>

      {/* Informations */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Identité */}
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-muted-foreground" />
            Identité
          </div>
          <InfoRow
            label="Matricule"
            value={<span className="font-mono text-xs">{emp.matricule}</span>}
          />
          <InfoRow
            label="Civilité"
            value={(emp as { civilite?: string | null }).civilite}
          />
          <InfoRow
            label="Genre"
            value={emp.genre === "M" ? "Masculin" : emp.genre === "F" ? "Féminin" : null}
          />
          <InfoRow
            label="Date de naissance"
            value={emp.date_naissance ? new Date(emp.date_naissance).toLocaleDateString("fr-CI") : null}
          />
          <InfoRow
            label="Nationalité"
            value={(emp as { nationalite?: string | null }).nationalite}
          />
          <InfoRow
            label="État civil"
            value={(emp as { etat_civil?: string | null }).etat_civil}
          />
          <InfoRow
            label="Enfants à charge"
            value={(emp as { nb_enfants?: number | null }).nb_enfants != null
              ? String((emp as { nb_enfants?: number | null }).nb_enfants)
              : null}
          />
          <InfoRow
            label="Email"
            value={
              emp.email ? (
                <a href={`mailto:${emp.email}`} className="text-primary hover:underline">
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
        </div>

        {/* Poste */}
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            Poste & Contrat
          </div>
          <InfoRow label="Poste" value={emp.poste} />
          <InfoRow label="Département" value={emp.departement} />
          <InfoRow
            label="Catégorie"
            value={(emp as { categorie?: string | null }).categorie}
          />
          <InfoRow
            label="Niveau d'études"
            value={(emp as { niveau_etude?: string | null }).niveau_etude}
          />
          <InfoRow
            label="Type de contrat"
            value={emp.type_contrat ? <Badge variant="outline">{emp.type_contrat}</Badge> : null}
          />
          <InfoRow
            label="Date d'embauche"
            value={new Date(emp.date_embauche).toLocaleDateString("fr-CI")}
          />
          <InfoRow label="Ancienneté" value={anciennete} />
          <InfoRow
            label="Salaire brut"
            value={
              emp.salaire_brut != null
                ? new Intl.NumberFormat("fr-CI", {
                    style: "currency",
                    currency: "XOF",
                    minimumFractionDigits: 0,
                  }).format(emp.salaire_brut)
                : null
            }
          />
        </div>
      </div>

      {/* Contrats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Historique des contrats</h2>
        </div>
        {!contracts || contracts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucun contrat enregistré pour cet employé.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Début</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fin</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">
                    Salaire brut
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant="outline">{c.type_contrat}</Badge>
                      {(c.renouvellement_count ?? 0) > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          × {c.renouvellement_count} renouv.
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(c.date_debut).toLocaleDateString("fr-CI")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.date_fin
                        ? new Date(c.date_fin).toLocaleDateString("fr-CI")
                        : "Indéterminé"}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {new Intl.NumberFormat("fr-CI", {
                        style: "currency",
                        currency: "XOF",
                        minimumFractionDigits: 0,
                      }).format(c.salaire_brut)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.statut === "actif" ? "default" : "secondary"}>
                        {c.statut ?? "actif"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Évaluations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Dernières évaluations</h2>
        </div>
        {!evaluations || evaluations.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucune évaluation enregistrée.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {evaluations.map((ev) => (
              <div key={ev.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{ev.periode}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(ev.date_evaluation).toLocaleDateString("fr-CI")}
                    </p>
                  </div>
                  {ev.periodicite && (
                    <Badge variant="outline" className="text-xs">
                      {ev.periodicite}
                    </Badge>
                  )}
                </div>
                {ev.score_global != null && (
                  <div className="mt-3">
                    <span
                      className={`text-2xl font-bold ${
                        ev.score_global >= 75
                          ? "text-emerald-600"
                          : ev.score_global >= 40
                          ? "text-amber-600"
                          : "text-red-500"
                      }`}
                    >
                      {ev.score_global}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {scoreLabel(ev.score_global)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Congés */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Congés récents</h2>
        </div>
        {!conges || conges.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucun congé enregistré.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Période</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Jours</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {conges.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">{c.type}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(c.date_debut).toLocaleDateString("fr-CI")} → {new Date(c.date_fin).toLocaleDateString("fr-CI")}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{c.nb_jours}j</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.statut === "approuve" ? "default" : c.statut === "refuse" ? "destructive" : "outline"}>
                        {c.statut === "approuve" ? "Approuvé" : c.statut === "refuse" ? "Refusé" : "En attente"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulletins de paie */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Banknote className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Derniers bulletins de paie</h2>
        </div>
        {!bulletins || bulletins.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucun bulletin de paie généré.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Période</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Brut</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">CNPS</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">ITS</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bulletins.map((b) => {
                  const fmtXOF = (n: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);
                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono">{b.periode}</td>
                      <td className="px-4 py-3 text-right">{fmtXOF(b.salaire_brut)}</td>
                      <td className="px-4 py-3 text-right text-red-600 hidden md:table-cell">−{fmtXOF(b.cnps_salarie)}</td>
                      <td className="px-4 py-3 text-right text-red-600 hidden md:table-cell">−{fmtXOF(b.its)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmtXOF(b.salaire_net)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={b.statut === "payé" ? "default" : b.statut === "validé" ? "secondary" : "outline"}>
                          {b.statut}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Checklist documents obligatoires */}
      {(() => {
        const DOCS_REQUIS = [
          "CNI / Passeport",
          "Extrait de naissance",
          "Casier judiciaire",
          "Contrat",
          "CV",
          "Diplômes",
          "Médical",
        ] as const;
        const familles = new Set(documents?.map((d) => d.famille).filter(Boolean));
        const manquants = DOCS_REQUIS.filter((d) => !familles.has(d));
        const presents = DOCS_REQUIS.filter((d) => familles.has(d));
        return (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Checklist documents</h2>
              <span className="text-xs text-muted-foreground">
                {presents.length}/{DOCS_REQUIS.length} fournis
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {DOCS_REQUIS.map((doc) => {
                const ok = familles.has(doc);
                return (
                  <div
                    key={doc}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      ok
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    <span className="text-base">{ok ? "✓" : "✗"}</span>
                    <span className="font-medium">{doc}</span>
                  </div>
                );
              })}
            </div>
            {manquants.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Documents manquants : {manquants.join(", ")}
              </p>
            )}
          </div>
        );
      })()}

      {/* Documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Documents</h2>
          </div>
          <DocumentUploadDialog employeeId={emp.id} companyId={emp.company_id} />
        </div>
        {!documents || documents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucun document archivé pour cet employé.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Document</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Famille</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">Taille</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Fichier</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{doc.name}</td>
                    <td className="px-4 py-3">
                      {doc.famille && (
                        <span className="text-xs font-medium rounded px-1.5 py-0.5 bg-muted">
                          {doc.famille}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                      {doc.file_size_kb != null ? `${doc.file_size_kb} Ko` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {new Date(doc.created_at!).toLocaleDateString("fr-CI")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Ouvrir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
