export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { LegalCaseDialog } from "@/components/rh/LegalCaseDialog";
import { CloseLegalCaseButton } from "@/components/rh/CloseLegalCaseButton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

export const metadata = { title: "Contentieux — RH Manager CI" };

const prioriteColor: Record<string, string> = {
  haute: "bg-red-100 text-red-700",
  normale: "bg-amber-100 text-amber-700",
  basse: "bg-slate-100 text-slate-600",
};

export default async function ContentieuxPage() {
  const supabase = createServerClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name")
    .order("full_name");

  const { data: cases } = await supabase
    .from("legal_cases")
    .select(
      `id, reference, titre, type_cas, date_ouverture, statut, priorite, description,
       employees(full_name)`
    )
    .order("date_ouverture", { ascending: false });

  const ouverts = cases?.filter((c) => c.statut === "ouvert") ?? [];
  const fermes = cases?.filter((c) => c.statut !== "ouvert") ?? [];

  return (
    <PageShell>
      <PageHeader
        title="Contentieux"
        description="Gestion des litiges — Droit du Travail ivoirien (Loi 2015-532)"
        actions={<LegalCaseDialog employees={employees ?? []} />}
      />

      {/* Rappels légaux */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Préavis CDI", content: "Ouvriers : 1 mois · Cadres : 3 mois" },
          { label: "Indemnité licenciement", content: "1/12 salaire annuel × ancienneté" },
          { label: "Délais légaux", content: "Inspection du Travail : 15j · Prescription : 2 ans" },
        ].map(({ label, content }) => (
          <div key={label} className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">{label}</p>
            <p className="text-sm text-slate-700 font-medium">{content}</p>
          </div>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Dossiers ouverts", value: ouverts.length, accent: ouverts.length > 0 },
          { label: "Dossiers fermés", value: fermes.length, accent: false },
          { label: "Total", value: (cases?.length ?? 0), accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">{label}</p>
            <p className={`text-2xl font-bold tabular-nums ${accent && value > 0 ? "text-red-600" : "text-slate-900"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Dossiers ouverts */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3">
          Dossiers ouverts{ouverts.length > 0 && ` · ${ouverts.length}`}
        </p>

        {ouverts.length === 0 ? (
          <EmptyState
            title="Aucun contentieux ouvert"
            description="Aucun litige en cours. Enregistrez un dossier dès qu'un contentieux survient pour suivre les délais légaux (inspection, prescription)."
            action={<LegalCaseDialog employees={employees ?? []} />}
          />
        ) : (
          <div className="space-y-3">
            {ouverts.map((c) => {
              const employee = Array.isArray(c.employees) ? c.employees[0] : c.employees;
              return (
                <div key={c.id} className="rounded-md border border-slate-200 bg-white p-4 hover:border-slate-200 transition-colors">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-mono text-slate-600">{c.reference}</span>
                        {c.type_cas && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                            {c.type_cas}
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${prioriteColor[c.priorite ?? "normale"] ?? "bg-slate-100 text-slate-600"}`}>
                          {c.priorite ?? "normale"}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800">{c.titre}</p>
                      {employee && (
                        <p className="text-sm text-slate-600 mt-0.5">{employee.full_name}</p>
                      )}
                      {c.description && (
                        <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{c.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xs text-slate-600">
                        {new Date(c.date_ouverture).toLocaleDateString("fr-CI")}
                      </p>
                      <CloseLegalCaseButton caseId={c.id} reference={c.reference} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dossiers fermés */}
      {fermes.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3">
            Dossiers fermés · {fermes.length}
          </p>
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Référence</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Titre</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Date</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fermes.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-[#ee7f03]/[0.04]">
                    <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">{c.reference}</td>
                    <td className="px-3 py-1.5 text-slate-700">{c.titre}</td>
                    <td className="px-3 py-1.5 text-slate-600 hidden md:table-cell text-xs">
                      {new Date(c.date_ouverture).toLocaleDateString("fr-CI")}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                        {c.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}
