export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CongesDialog } from "@/components/rh/CongesDialog";
import { CongesApprovalButton } from "@/components/rh/CongesApprovalButton";
import { ArretMaladieDialog } from "@/components/rh/ArretMaladieDialog";
import { CalendarDays, CheckCircle, Clock } from "lucide-react";

export const metadata = { title: "Conges — RH Manager CI" };

const TYPE_LABELS: Record<string, string> = {
  annuel: "Conge annuel",
  maladie: "Maladie",
  arret_maladie: "Arrêt maladie",
  maternite: "Maternite",
  paternite: "Paternite",
  sans_solde: "Sans solde",
  exceptionnel: "Exceptionnel",
};

const STATUT_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  en_attente: "outline",
  valide_manager: "secondary",
  approuve: "default",
  refuse: "destructive",
};

const STATUT_LABEL: Record<string, string> = {
  en_attente: "En attente",
  valide_manager: "Valide manager",
  approuve: "Approuve",
  refuse: "Refuse",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-CI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function CongesPage() {
  const supabase = createServerClient();

  const [{ data: conges }, { data: employees }] = await Promise.all([
    supabase
      .from("conges")
      .select(
        `id, type, date_debut, date_fin, nb_jours, statut, commentaire, refus_motif, created_at,
         est_justifie, est_at, justificatif_url,
         employees(full_name, matricule)`
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("employees")
      .select("id, prenom, nom, full_name, matricule")
      .eq("statut", "actif")
      .order("full_name"),
  ]);

  // V1 : tous les utilisateurs connectes ont les droits manager ET RH
  const canManagerApprove = true;
  const canRhApprove = true;

  const enAttenteManager =
    conges?.filter((c) => c.statut === "en_attente") ?? [];
  const enAttenteRh =
    conges?.filter((c) => c.statut === "valide_manager") ?? [];
  const historique =
    conges?.filter(
      (c) => c.statut === "approuve" || c.statut === "refuse"
    ) ?? [];

  // Préparer les employés pour ArretMaladieDialog (prenom + nom)
  const employeesForArret = (employees ?? []).map((e) => ({
    id: e.id,
    prenom: (e as { prenom?: string }).prenom ?? e.full_name?.split(' ')[0] ?? '',
    nom: (e as { nom?: string }).nom ?? e.full_name?.split(' ').slice(1).join(' ') ?? '',
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Conges</h1>
          <p className="text-sm text-muted-foreground">
            Droit : 2,5 jours/mois (Art. 25 CT-CI)
          </p>
        </div>
        <div className="flex gap-2">
          <ArretMaladieDialog employees={employeesForArret} />
          <CongesDialog employees={employees ?? []} />
        </div>
      </div>

      {/* Rappel legal */}
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Droits legaux — Code du Travail ivoirien</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <span>Annuel : <strong>30 jours/an max</strong> (2,5j x 12 mois)</span>
          <span>Maternite : <strong>14 semaines</strong></span>
          <span>Paternite : <strong>10 jours</strong></span>
        </div>
      </div>

      {/* Note arrêts maladie */}
      <div className="rounded-lg border bg-amber-50 border-amber-200 p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">Arrêts maladie — impact bulletin de paie</p>
        <p className="text-xs">
          Les arrêts maladie avec justificatif validé (<strong>Justifié</strong>) ne génèrent <strong>pas de retenue salariale</strong>.
          Pour les absences non justifiées, saisir manuellement les jours dans le bulletin de paie.
        </p>
      </div>

      {/* Section 1 : En attente de validation manager */}
      <div>
        <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          En attente de validation manager
          {enAttenteManager.length > 0 && (
            <Badge variant="outline" className="ml-1">
              {enAttenteManager.length}
            </Badge>
          )}
        </h2>

        {enAttenteManager.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucune demande en attente de validation manager.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Employe
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Periode
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Jours
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enAttenteManager.map((c) => {
                  const emp = Array.isArray(c.employees)
                    ? c.employees[0]
                    : c.employees;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{emp?.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {emp?.matricule}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span>{TYPE_LABELS[c.type] ?? c.type}</span>
                          {c.type === 'arret_maladie' && (
                            <div className="flex gap-1">
                              {(c as { est_at?: boolean }).est_at
                                ? <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-300">AT</Badge>
                                : (c as { est_justifie?: boolean }).est_justifie
                                  ? <Badge className="text-xs bg-green-100 text-green-800 border-green-300">Justifié</Badge>
                                  : <Badge className="text-xs bg-red-100 text-red-800 border-red-300">Non justifié</Badge>
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {formatDate(c.date_debut)} {"->"} {formatDate(c.date_fin)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {c.nb_jours}j
                      </td>
                      <td className="px-4 py-3">
                        <CongesApprovalButton
                          congeId={c.id}
                          statut={c.statut ?? "en_attente"}
                          canManagerApprove={canManagerApprove}
                          canRhApprove={canRhApprove}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2 : En attente de validation RH */}
      <div>
        <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-500" />
          En attente de validation RH
          {enAttenteRh.length > 0 && (
            <Badge variant="outline" className="ml-1">
              {enAttenteRh.length}
            </Badge>
          )}
        </h2>

        {enAttenteRh.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucune demande en attente de validation RH.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Employe
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Periode
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Jours
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enAttenteRh.map((c) => {
                  const emp = Array.isArray(c.employees)
                    ? c.employees[0]
                    : c.employees;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{emp?.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {emp?.matricule}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span>{TYPE_LABELS[c.type] ?? c.type}</span>
                          {c.type === 'arret_maladie' && (
                            <div className="flex gap-1">
                              {(c as { est_at?: boolean }).est_at
                                ? <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-300">AT</Badge>
                                : (c as { est_justifie?: boolean }).est_justifie
                                  ? <Badge className="text-xs bg-green-100 text-green-800 border-green-300">Justifié</Badge>
                                  : <Badge className="text-xs bg-red-100 text-red-800 border-red-300">Non justifié</Badge>
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {formatDate(c.date_debut)} {"->"} {formatDate(c.date_fin)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {c.nb_jours}j
                      </td>
                      <td className="px-4 py-3">
                        <CongesApprovalButton
                          congeId={c.id}
                          statut={c.statut ?? "valide_manager"}
                          canManagerApprove={canManagerApprove}
                          canRhApprove={canRhApprove}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historique */}
      <div>
        <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-muted-foreground" />
          Historique
        </h2>
        {historique.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucun conge traite.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Employe
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Periode
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Jours
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {historique.map((c) => {
                  const emp = Array.isArray(c.employees)
                    ? c.employees[0]
                    : c.employees;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {emp?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span>{TYPE_LABELS[c.type] ?? c.type}</span>
                          {c.type === 'arret_maladie' && (
                            <div className="flex gap-1">
                              {(c as { est_at?: boolean }).est_at
                                ? <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-300">AT</Badge>
                                : (c as { est_justifie?: boolean }).est_justifie
                                  ? <Badge className="text-xs bg-green-100 text-green-800 border-green-300">Justifié</Badge>
                                  : <Badge className="text-xs bg-red-100 text-red-800 border-red-300">Non justifié</Badge>
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {formatDate(c.date_debut)} {"->"} {formatDate(c.date_fin)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {c.nb_jours}j
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={
                              STATUT_VARIANT[c.statut ?? "en_attente"] ??
                              "outline"
                            }
                          >
                            {STATUT_LABEL[c.statut ?? ""] ?? c.statut}
                          </Badge>
                          {c.statut === "refuse" && c.refus_motif && (
                            <p className="text-xs text-muted-foreground italic">
                              {c.refus_motif}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
