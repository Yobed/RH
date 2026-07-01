export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { MedicalExamDialog } from "@/components/rh/MedicalExamDialog";
import { PageShell, PageHeader, StatCard } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateLocal } from "@/lib/utils";

export const metadata = { title: "Santé & Sécurité — RH Manager CI" };

const resultatColor: Record<string, string> = {
  APTE: "bg-emerald-100 text-emerald-700",
  INAPTE: "bg-red-100 text-red-700",
  APTE_AVEC_RESERVES: "bg-amber-100 text-amber-700",
};

export default async function MedicalPage() {
  const supabase = createServerClient();

  const { data: exams } = await supabase
    .from("medical_exams")
    .select(`*, employees!inner(full_name, poste)`)
    .order("date_examen", { ascending: false });

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, poste")
    .eq("statut", "actif")
    .order("full_name");

  const aptes = exams?.filter((e) => e.resultat === "APTE").length ?? 0;
  const aProgrammer = exams?.filter(
    (e) => e.prochaine_visite && new Date(e.prochaine_visite) < new Date(Date.now() + 30 * 86400_000)
  ).length ?? 0;
  const inaptes = exams?.filter((e) => e.resultat !== "APTE").length ?? 0;

  return (
    <PageShell>
      <PageHeader
        title="Santé & Sécurité au Travail"
        description="Suivi des visites médicales, aptitudes et recommandations de la médecine du travail"
        help="Suivi des visites médicales du travail (embauche, périodiques, reprise). Organiser ces visites est une obligation de l'employeur (Code du Travail ivoirien)."
        actions={<MedicalExamDialog employees={employees ?? []} />}
      />

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Aptes" value={aptes} tone="success" />
        <StatCard label="À programmer (30j)" value={aProgrammer} tone={aProgrammer > 0 ? "warning" : "default"} />
        <StatCard label="Inaptes / Réserves" value={inaptes} tone={inaptes > 0 ? "danger" : "default"} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {!exams || exams.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Aucun examen médical enregistré"
              description="Planifiez la visite médicale d'embauche, périodique ou de reprise de vos salariés — une obligation de l'employeur."
              action={<MedicalExamDialog employees={employees ?? []} />}
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Employé</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type d&apos;examen</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Date</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Résultat</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Prochaine visite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {exams.map((exam) => {
                const emp = Array.isArray(exam.employees) ? exam.employees[0] : exam.employees;
                const overdue = exam.prochaine_visite && new Date(exam.prochaine_visite) < new Date();
                return (
                  <tr key={exam.id} className="transition-colors hover:bg-[#ee7f03]/[0.04]">
                    <td className="px-3 py-1.5">
                      <p className="font-semibold text-slate-800">{emp?.full_name}</p>
                      <p className="text-xs text-slate-600">{emp?.poste}</p>
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">{exam.type_examen?.replace(/_/g, " ")}</td>
                    <td className="px-3 py-1.5 text-slate-600 text-xs tabular-nums">
                      {formatDateLocal(exam.date_examen)}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${resultatColor[exam.resultat] ?? "bg-slate-100 text-slate-600"}`}>
                        {exam.resultat?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 hidden md:table-cell text-xs tabular-nums">
                      {exam.prochaine_visite ? (
                        <span className={overdue ? "text-red-600 font-semibold" : "text-slate-600"}>
                          {formatDateLocal(exam.prochaine_visite)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
