export const dynamic = 'force-dynamic';

import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, FolderOpen } from "lucide-react";
import { DossierEmployeView } from "@/components/rh/ged/DossierEmployeView";
import { DossierCompletudeScore } from "@/components/rh/DossierCompletudeScore";

interface PageProps {
  params: { employeeId: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createServerClient();
  const { data: emp } = await supabase
    .from("employees")
    .select("full_name")
    .eq("id", params.employeeId)
    .single();
  return { title: emp ? `${emp.full_name} — GED` : "Dossier employé — GED" };
}

export default async function DossierEmployePage({ params }: PageProps) {
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .single();

  if (!profile?.company_id) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select(
      "id, full_name, poste, departement, matricule, date_embauche, type_contrat, statut, email, phone"
    )
    .eq("id", params.employeeId)
    .eq("company_id", profile.company_id)
    .single();

  if (!employee) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, famille, file_url, file_type, file_size_kb, created_at")
    .eq("employee_id", params.employeeId)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  const docList = documents ?? [];
  const familles = new Set(docList.map((d) => d.famille ?? ""));
  const hasContract = familles.has("Contrat");
  const hasMedicalExam = familles.has("Médical");
  const hasEvaluation = familles.has("Évaluation");
  const scoreDocuments = docList.map((d) => ({ type: d.famille ?? "", name: d.name }));

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Fil d'Ariane */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/ged" className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors font-medium">
          <FolderOpen className="h-4 w-4" />
          GED
        </Link>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <span className="font-semibold text-slate-800">{employee.full_name}</span>
      </nav>

      {/* En-tête employé */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500" />
        <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
              {(() => {
                const names = employee.full_name.trim().split(/\s+/);
                return names.length >= 2
                  ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
                  : employee.full_name.slice(0, 2).toUpperCase();
              })()}
            </div>
            {/* Infos */}
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">{employee.full_name}</h1>
              <p className="text-sm text-slate-600 mt-0.5">{employee.poste}</p>
              {employee.departement && (
                <p className="text-xs text-slate-400 mt-0.5">{employee.departement}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-100 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500">
                  {employee.matricule}
                </span>
                {employee.type_contrat && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600">
                    {employee.type_contrat}
                  </span>
                )}
                {employee.statut && employee.statut !== "actif" && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-500 uppercase tracking-wide">
                    {employee.statut}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Méta droite */}
          <div className="text-right shrink-0 space-y-1">
            {employee.date_embauche && (
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Embauche :</span>{" "}
                {new Date(employee.date_embauche).toLocaleDateString("fr-CI", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            {employee.email && (
              <p className="text-xs text-slate-400">{employee.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Score complétude */}
      <DossierCompletudeScore
        employeeId={employee.id}
        documents={scoreDocuments}
        hasContract={hasContract}
        hasMedicalExam={hasMedicalExam}
        hasEvaluation={hasEvaluation}
        size="lg"
      />

      {/* Vue dossier avec onglets par famille */}
      <DossierEmployeView
        employee={employee}
        documents={docList}
        companyId={profile.company_id}
      />
    </div>
  );
}
