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
      <span className="inline-flex items-center rounded-full bg-[#ee7f03]/10 px-2.5 py-0.5 text-xs font-medium text-[#ee7f03]">
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
      {/* En-tête de page Odoo : titre compact + action primaire */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">Contrats</h1>
        <ContractDialog employees={employees ?? []} />
      </div>

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
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">Employé</th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">Type</th>
                  <th className="hidden px-3 py-2 text-[11px] font-semibold uppercase tracking-wide md:table-cell">Début</th>
                  <th className="hidden px-3 py-2 text-[11px] font-semibold uppercase tracking-wide md:table-cell">Fin</th>
                  <th className="hidden px-3 py-2 text-[11px] font-semibold uppercase tracking-wide lg:table-cell">Fin essai</th>
                  <th className="hidden px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide lg:table-cell">Salaire brut</th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">Statut</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                    <tr key={c.id} className="transition-colors hover:bg-[#ee7f03]/[0.04]">
                      <td className="px-3 py-1.5">
                        <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100">{employee.full_name}</p>
                        <p className="text-[12px] text-slate-500">{employee.poste}</p>
                      </td>
                      <td className="px-3 py-1.5">
                        <TypeBadge type={c.type_contrat} />
                      </td>
                      <td className="hidden px-3 py-1.5 text-[13px] text-slate-600 md:table-cell dark:text-slate-300">
                        {new Date(c.date_debut).toLocaleDateString("fr-CI")}
                      </td>
                      <td className="hidden px-3 py-1.5 text-[13px] md:table-cell">
                        {c.date_fin ? (
                          <div className="flex items-center gap-2">
                            <span className={isExpiringSoon ? "font-medium text-red-600" : "text-slate-600 dark:text-slate-300"}>
                              {new Date(c.date_fin).toLocaleDateString("fr-CI")}
                            </span>
                            {isExpiringSoon && jours !== null && <JoursBadge jours={jours} />}
                          </div>
                        ) : (
                          <span className="text-slate-500">Indéterminé</span>
                        )}
                      </td>
                      <td className="hidden px-3 py-1.5 text-[13px] text-slate-600 lg:table-cell dark:text-slate-300">
                        {c.date_fin_essai
                          ? new Date(c.date_fin_essai).toLocaleDateString("fr-CI")
                          : "—"}
                      </td>
                      <td className="hidden px-3 py-1.5 text-right font-mono tabular-nums text-[13px] text-slate-700 lg:table-cell dark:text-slate-200">
                        {fmt(c.salaire_brut)}
                      </td>
                      <td className="px-3 py-1.5">
                        <StatutBadge statut={c.statut} />
                      </td>
                      <td className="px-3 py-1.5 text-right">
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
