export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { DisciplinaryDialog } from "@/components/rh/DisciplinaryDialog";
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
  blâme:                      { text: "text-purple-700", bg: "bg-purple-50" },
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
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Procédures Disciplinaires</h1>
          <p className="text-sm text-slate-400">
            Suivi des demandes d'explication, avertissements, mises à pied et licenciements.
          </p>
        </div>
        <DisciplinaryDialog employees={employees ?? []} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Total dossiers</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{total}</p>
          <p className="mt-1 text-xs text-slate-400">procédures enregistrées</p>
        </div>
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Dossiers ouverts</p>
          <p className={`mt-2 text-3xl font-bold ${ouverts > 0 ? "text-red-600" : "text-slate-900"}`}>{ouverts}</p>
          <p className="mt-1 text-xs text-slate-400">en cours de traitement</p>
        </div>
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Clôturés</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{clotures}</p>
          <p className="mt-1 text-xs text-slate-400">procédures closes</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
        {!procedures || procedures.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium text-slate-400 text-sm">Aucune procédure enregistrée</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Employé</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Type de sanction</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 hidden md:table-cell">Date incident</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Statut</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {procedures.map((proc) => {
                const employee = Array.isArray(proc.employees) ? proc.employees[0] : proc.employees;
                if (!employee) return null;
                const statutCfg = getStatutCfg(proc.statut);
                const typeCfg = getTypeCfg(proc.type);
                return (
                  <tr key={proc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{employee.full_name}</p>
                      <p className="text-xs text-slate-400">{employee.poste}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${typeCfg.bg} ${typeCfg.text}`}>
                        {proc.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500 tabular-nums">
                      {proc.date_incident
                        ? new Date(proc.date_incident).toLocaleDateString('fr-FR')
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statutCfg.bg} ${statutCfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statutCfg.dot}`} />
                        {statutCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
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
    </div>
  );
}
