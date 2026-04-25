export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { MedicalExamDialog } from "@/components/rh/MedicalExamDialog";
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Santé & Sécurité au Travail</h1>
          <p className="text-sm text-slate-600 mt-0.5 font-medium">Suivi des visites médicales, aptitudes et recommandations de la médecine du travail</p>
        </div>
        <div className="shrink-0">
          <MedicalExamDialog employees={employees ?? []} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Aptes", value: aptes, color: "text-emerald-600" },
          { label: "À programmer (30j)", value: aProgrammer, color: aProgrammer > 0 ? "text-amber-600" : "text-slate-900" },
          { label: "Inaptes / Réserves", value: inaptes, color: inaptes > 0 ? "text-red-600" : "text-slate-900" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">{label}</p>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
        {!exams || exams.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-600">Aucun examen médical enregistré</p>
            <p className="text-xs text-slate-600 mt-1">Cliquez sur «&nbsp;Ajouter&nbsp;» pour enregistrer un examen</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Employé</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Type d&apos;examen</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Résultat</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden md:table-cell">Prochaine visite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {exams.map((exam) => {
                const emp = Array.isArray(exam.employees) ? exam.employees[0] : exam.employees;
                const overdue = exam.prochaine_visite && new Date(exam.prochaine_visite) < new Date();
                return (
                  <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{emp?.full_name}</p>
                      <p className="text-xs text-slate-600">{emp?.poste}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{exam.type_examen?.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs tabular-nums">
                      {formatDateLocal(exam.date_examen)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${resultatColor[exam.resultat] ?? "bg-slate-100 text-slate-600"}`}>
                        {exam.resultat?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs tabular-nums">
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
    </div>
  );
}
