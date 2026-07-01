export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { DisciplinaryDialog } from "@/components/rh/DisciplinaryDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell, PageHeader, StatCard } from "@/components/ui/page-shell";
import Link from "next/link";

export const metadata = { title: "Disciplinaire — RH Manager CI" };

const statutConfig: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  CLOTURE:     { dot: "bg-slate-400",  text: "text-slate-600", bg: "bg-slate-100",  label: "Clôturé"     },
  EN_COURS:    { dot: "bg-red-500",    text: "text-red-700",   bg: "bg-red-50",     label: "En cours"    },
  OUVERT:      { dot: "bg-red-500",    text: "text-red-700",   bg: "bg-red-50",     label: "Ouvert"      },
  EN_ATTENTE:  { dot: "bg-amber-400",  text: "text-amber-700", bg: "bg-amber-50",   label: "En attente"  },
};

const typeConfig: Record<string, { text: string; bg: string }> = {
  avertissement:              { text: "text-amber-700",  bg: "bg-amber-50"  },
  mise_a_pied:                { text: "text-orange-700", bg: "bg-orange-50" },
  licenciement:               { text: "text-red-700",    bg: "bg-red-50"    },
  demande_d_explication:      { text: "text-sky-700",    bg: "bg-sky-50"    },
  blâme:                      { text: "text-slate-700", bg: "bg-slate-50" },
};

function getStatutCfg(statut: string) {
  return statutConfig[statut] ?? { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100", label: statut.replace(/_/g, " ") };
}

function getTypeCfg(type: string) {
  return typeConfig[type] ?? { text: "text-slate-700", bg: "bg-slate-100" };
}

export default async function DisciplinairePage() {
  const supabase = createServerClient();

  const [{ data: procedures }, { data: employees }] = await Promise.all([
    supabase
      .from("disciplinary_procedures")
      .select(
        `id, type, motif, statut, date_incident, created_at,
         employees!inner(full_name, poste)`
      )
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("employees")
      .select("id, full_name, poste")
      .eq("statut", "actif")
      .order("full_name"),
  ]);

  const total = procedures?.length ?? 0;
  const ouverts = procedures?.filter((p) => p.statut !== "CLOTURE").length ?? 0;
  const clotures = total - ouverts;

  return (
    <PageShell>
      <PageHeader
        title="Procédures Disciplinaires"
        description="Suivi des demandes d'explication, avertissements, mises à pied et licenciements."
        actions={<DisciplinaryDialog employees={employees ?? []} />}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total dossiers" value={total} sub="procédures enregistrées" />
        <StatCard label="Dossiers ouverts" value={ouverts} sub="en cours de traitement" tone={ouverts > 0 ? "danger" : "default"} />
        <StatCard label="Clôturés" value={clotures} sub="procédures closes" tone="success" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {!procedures || procedures.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Aucune procédure disciplinaire"
              description="Ouvrez une procédure (demande d'explication, avertissement, mise à pied…) pour la suivre et garder une trace conforme au Code du Travail."
              action={<DisciplinaryDialog employees={employees ?? []} />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Employé</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type de sanction</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Date incident</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {procedures.map((proc) => {
                const employee = Array.isArray(proc.employees) ? proc.employees[0] : proc.employees;
                if (!employee) return null;
                const statutCfg = getStatutCfg(proc.statut);
                const typeCfg = getTypeCfg(proc.type);
                return (
                  <tr key={proc.id} className="transition-colors hover:bg-[#ee7f03]/[0.04]">
                    <td className="px-3 py-1.5">
                      <p className="font-semibold text-slate-900">{employee.full_name}</p>
                      <p className="text-xs text-slate-600">{employee.poste}</p>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${typeCfg.bg} ${typeCfg.text}`}>
                        {proc.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 hidden md:table-cell text-slate-600 tabular-nums">
                      {proc.date_incident
                        ? new Date(proc.date_incident).toLocaleDateString('fr-FR')
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statutCfg.bg} ${statutCfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statutCfg.dot}`} />
                        {statutCfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <Link
                        href={`/disciplinaire/${proc.id}`}
                        className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        Détails
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
