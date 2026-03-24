export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/rh/KpiCard";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileWarning,
  Briefcase,
  BarChart2,
  Scale,
  TrendingUp,
} from "lucide-react";

export const metadata = { title: "Tableau de bord — RH Manager CI" };

export default async function RhPage() {
  const supabase = createServerClient();

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [
    { count: totalActifs },
    { count: totalFemmes },
    { count: cddExpirant },
    { count: postesOuverts },
    { count: evalBrouillon },
    { count: contentieuxOuverts },
    { data: derniersEmployes },
    { data: parDepartement },
    { data: congesEnAttente },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("statut", "actif"),
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("statut", "actif")
      .eq("genre", "F"),
    supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("statut", "actif")
      .gte("date_fin", today)
      .lte("date_fin", in30Days),
    supabase
      .from("job_postings")
      .select("*", { count: "exact", head: true })
      .eq("statut", "ouvert"),
    supabase
      .from("evaluations")
      .select("*", { count: "exact", head: true })
      .eq("statut", "brouillon"),
    supabase
      .from("legal_cases")
      .select("*", { count: "exact", head: true })
      .eq("statut", "ouvert"),
    supabase
      .from("employees")
      .select("id, full_name, poste, departement, date_embauche, statut, type_contrat")
      .eq("statut", "actif")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("employees")
      .select("departement")
      .eq("statut", "actif"),
    supabase
      .from("conges")
      .select("id, employees(full_name), type, nb_jours, date_debut, date_fin")
      .eq("statut", "demande")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const pctFemmes =
    totalActifs && totalActifs > 0
      ? Math.round(((totalFemmes ?? 0) / totalActifs) * 100)
      : 0;

  // Répartition par département
  const deptMap: Record<string, number> = {};
  parDepartement?.forEach((e) => {
    const dept = e.departement ?? "Non défini";
    deptMap[dept] = (deptMap[dept] ?? 0) + 1;
  });
  const deptData = Object.entries(deptMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const deptMax = deptData[0]?.[1] ?? 1;

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble des ressources humaines
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Effectif actif"
          value={totalActifs ?? 0}
          icon={Users}
          description="Employés en activité"
        />
        <KpiCard
          label="Part féminine"
          value={`${pctFemmes} %`}
          icon={TrendingUp}
          description={`${totalFemmes ?? 0} femmes sur ${totalActifs ?? 0} employés`}
          variant="success"
        />
        <KpiCard
          label="CDD expirant (30j)"
          value={cddExpirant ?? 0}
          icon={FileWarning}
          description="Contrats à renouveler ou convertir"
          variant={(cddExpirant ?? 0) > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Postes ouverts"
          value={postesOuverts ?? 0}
          icon={Briefcase}
          description="Offres de recrutement actives"
        />
        <KpiCard
          label="Évaluations en attente"
          value={evalBrouillon ?? 0}
          icon={BarChart2}
          description="Brouillons à finaliser"
          variant={(evalBrouillon ?? 0) > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Contentieux ouverts"
          value={contentieuxOuverts ?? 0}
          icon={Scale}
          description="Dossiers en cours de traitement"
          variant={(contentieuxOuverts ?? 0) > 0 ? "danger" : "default"}
        />
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Répartition par département */}
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 text-base font-semibold">Effectif par département</h2>
          {deptData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {deptData.map(([dept, count]) => (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate max-w-[180px]">{dept}</span>
                    <span className="font-medium ml-2">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(count / deptMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Congés en attente */}
        <div className="rounded-lg border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Congés en attente d'approbation</h2>
            {(congesEnAttente?.length ?? 0) > 0 && (
              <Badge variant="outline">{congesEnAttente!.length}</Badge>
            )}
          </div>
          {!congesEnAttente || congesEnAttente.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
          ) : (
            <div className="space-y-2">
              {congesEnAttente.map((c) => {
                const emp = c.employees as unknown as { full_name: string } | null;
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{emp?.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.date_debut as string).toLocaleDateString("fr-CI")} — {c.nb_jours}j
                      </p>
                    </div>
                    <Badge variant="outline">{c.type}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Derniers employés */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Derniers employés ajoutés</h2>
        {!derniersEmployes || derniersEmployes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Aucun employé enregistré. Ajoutez votre premier employé dans le module Employés.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Poste</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Département</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Contrat</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {derniersEmployes.map((emp) => (
                  <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{emp.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.poste}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {emp.departement ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {emp.type_contrat && (
                        <Badge variant="outline">{emp.type_contrat}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={emp.statut === "actif" ? "default" : "secondary"}
                      >
                        {emp.statut}
                      </Badge>
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
