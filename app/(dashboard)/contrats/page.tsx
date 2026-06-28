import { createServerClient } from "@/lib/supabase/server";
import { ContractDialog, type ExistingContract } from "@/components/rh/ContractDialog";
import { PageShell, PageHeader, StatCard } from "@/components/ui/page-shell";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Contrats — RH Manager CI" };

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

const TypeBadge = ({ type }: { type: string }) => {
  const isCdi = type?.toUpperCase() === "CDI";
  if (isCdi) {
    return (
      <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
        {type}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      {type}
    </span>
  );
};

const StatutBadge = ({ statut }: { statut: string }) => <StatusBadge status={statut} />;

const JoursBadge = ({ jours }: { jours: number }) => {
  if (jours < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 whitespace-nowrap">
        Dépassé ({Math.abs(jours)}j)
      </span>
    );
  }
  if (jours === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 whitespace-nowrap">
        Aujourd'hui
      </span>
    );
  }
  if (jours <= 7) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 whitespace-nowrap">
        J-{jours}
      </span>
    );
  }
  if (jours <= 15) {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600 whitespace-nowrap">
        J-{jours}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
      J-{jours}
    </span>
  );
};

export default async function ContratsPage() {
  const supabase = createServerClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, type_contrat")
    .eq("statut", "actif")
    .order("full_name");

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: contratsExpirants } = await supabase
    .from("contracts")
    .select(
      `id, type_contrat, date_fin, date_fin_essai, renouvellement_count, statut,
       employees!inner(id, full_name, poste, manager_id)`
    )
    .eq("statut", "actif")
    .lte("date_fin", in30Days)
    .order("date_fin", { ascending: true });

  const allManagerIds = contratsExpirants
    ?.flatMap((c) => Array.isArray(c.employees) ? c.employees : [c.employees])
    .map((emp) => emp?.manager_id)
    .filter((id): id is string => !!id) ?? [];
  const managerIds = Array.from(new Set(allManagerIds));
  const managerNames: Record<string, string> = {};
  if (managerIds.length > 0) {
    const { data: managers } = await supabase
      .from("employees")
      .select("id, full_name")
      .in("id", managerIds);
    managers?.forEach((m) => { managerNames[m.id] = m.full_name; });
  }

  const { data: tousContrats } = await supabase
    .from("contracts")
    .select(
      `id, employee_id, type_contrat, date_debut, date_fin, date_fin_essai, salaire_brut, statut, renouvellement_count,
       employees!inner(full_name, poste)`
    )
    .order("created_at", { ascending: false })
    .limit(20);

  function joursRestants(dateFin: string) {
    return Math.ceil(
      (new Date(dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Contrats"
        description="Gestion des contrats de travail — CDD, CDI, Stage, Apprentissage"
        help="Tous les contrats de travail (CDI, CDD, avenants) de vos salariés. L'écrit est obligatoire pour un CDD et fortement recommandé pour un CDI (Code du Travail ivoirien)."
        actions={<ContractDialog employees={employees ?? []} />}
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Contrats actifs"
          value={tousContrats?.filter((c) => c.statut === "actif").length ?? 0}
          sub="en cours"
          tone="brand"
        />
        <StatCard
          label="Expirant sous 30j"
          value={contratsExpirants?.length ?? 0}
          sub="à renouveler ou clôturer"
          tone={(contratsExpirants?.length ?? 0) > 0 ? "warning" : "default"}
        />
        <StatCard
          label="CDI"
          value={tousContrats?.filter((c) => c.type_contrat?.toUpperCase() === "CDI" && c.statut === "actif").length ?? 0}
          sub="contrats permanents"
          tone="success"
        />
      </div>

      {/* Alertes expirations */}
      {contratsExpirants && contratsExpirants.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
          <div className="flex items-center gap-2 mb-3 text-amber-700 font-semibold text-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {contratsExpirants.length} contrat(s) expirant dans les 30 jours
          </div>
          <div className="space-y-2">
            {contratsExpirants.map((c) => {
              const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
              if (!emp) return null;
              const jours = joursRestants(c.date_fin!);
              const managerNom = emp.manager_id ? managerNames[emp.manager_id] : null;
              return (
                <div
                  key={c.id}
                  className="rounded-xl bg-white px-3 py-2.5 text-sm border border-amber-100/80 space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-semibold text-slate-800">{emp.full_name}</span>
                      <span className="text-slate-600 ml-2 text-xs">— {emp.poste}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TypeBadge type={c.type_contrat} />
                      {(c.renouvellement_count ?? 0) >= 2 && (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                          Conversion CDI requise
                        </span>
                      )}
                      <JoursBadge jours={jours} />
                    </div>
                  </div>
                  {managerNom && (
                    <p className="text-xs text-amber-700">
                      À informer — N+1 : <span className="font-medium">{managerNom}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des contrats */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Contrats récents</h2>
        {!tousContrats || tousContrats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <p className="font-medium text-slate-600">Aucun contrat enregistré</p>
            <p className="mt-1 text-sm text-slate-600">
              Les contrats sont créés automatiquement lors de l&apos;ajout d&apos;un employé.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Employé</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Type</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden md:table-cell">Début</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden md:table-cell">Fin</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden lg:table-cell">Fin essai</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden lg:table-cell">Salaire brut</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Statut</th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tousContrats.map((c) => {
                  const employee = Array.isArray(c.employees) ? c.employees[0] : c.employees;
                  if (!employee) return null;
                  const jours = c.date_fin ? joursRestants(c.date_fin) : null;
                  const isExpiringSoon = jours !== null && jours <= 30 && c.statut === "actif";
                  const editContract: ExistingContract = {
                    id: c.id,
                    employee_id: c.employee_id,
                    type_contrat: c.type_contrat as ExistingContract["type_contrat"],
                    date_debut: c.date_debut,
                    date_fin: c.date_fin,
                    date_fin_essai: c.date_fin_essai,
                    salaire_brut: c.salaire_brut,
                    renouvellement_count: c.renouvellement_count,
                  };
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <p className="font-semibold text-slate-800">{employee.full_name}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{employee.poste}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <TypeBadge type={c.type_contrat} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                        {new Date(c.date_debut).toLocaleDateString("fr-CI")}
                      </td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">
                        {c.date_fin ? (
                          <div className="flex items-center gap-2">
                            <span className={isExpiringSoon ? "text-red-600 font-medium" : "text-slate-600"}>
                              {new Date(c.date_fin).toLocaleDateString("fr-CI")}
                            </span>
                            {isExpiringSoon && jours !== null && <JoursBadge jours={jours} />}
                          </div>
                        ) : (
                          <span className="text-slate-600">Indéterminé</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">
                        {c.date_fin_essai
                          ? new Date(c.date_fin_essai).toLocaleDateString("fr-CI")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right hidden lg:table-cell font-mono tabular-nums text-slate-600">
                        {fmt(c.salaire_brut)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <StatutBadge statut={c.statut} />
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <ContractDialog employees={[]} contract={editContract} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
