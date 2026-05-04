export const dynamic = 'force-dynamic';
export const metadata = { title: "GED — RH Manager CI" };

import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { GedSearchEmployes } from "@/components/rh/ged/GedSearchEmployes";
import { FolderOpen, FileText, Users } from "lucide-react";

interface PageProps {
  searchParams: { q?: string };
}

export default async function GedPage({ searchParams }: PageProps) {
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .single();

  if (!profile?.company_id) return null;

  let empQuery = supabase
    .from("employees")
    .select("id, full_name, poste, departement, matricule, statut, type_contrat")
    .eq("company_id", profile.company_id)
    .order("full_name");

  if (searchParams.q) {
    empQuery = empQuery.ilike("full_name", `%${searchParams.q}%`);
  }

  const { data: employees } = await empQuery;

  const { data: docStats } = await supabase
    .from("documents")
    .select("employee_id, famille")
    .eq("company_id", profile.company_id)
    .not("employee_id", "is", null);

  type DocStats = { total: number; familles: Set<string> };
  const statsMap: Record<string, DocStats> = {};
  docStats?.forEach(({ employee_id, famille }) => {
    if (!employee_id) return;
    if (!statsMap[employee_id]) statsMap[employee_id] = { total: 0, familles: new Set() };
    statsMap[employee_id].total++;
    if (famille) statsMap[employee_id].familles.add(famille);
  });

  const totalDocs = docStats?.length ?? 0;
  const dossiersOuverts = Object.keys(statsMap).length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <FolderOpen className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">GED</h1>
        </div>
        <p className="text-sm text-slate-500 ml-10">
          Dossiers numériques par employé — classement par famille documentaire.
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Employés</p>
            <p className="text-2xl font-bold text-slate-800">{employees?.length ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <FolderOpen className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Dossiers actifs</p>
            <p className="text-2xl font-bold text-slate-800">{dossiersOuverts}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Documents</p>
            <p className="text-2xl font-bold text-slate-800">{totalDocs}</p>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <GedSearchEmployes initialQ={searchParams.q} />

      {/* Grille employés */}
      {!employees || employees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-20 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-slate-200 mb-3" />
          <p className="text-sm font-medium text-slate-500">Aucun employé trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {employees.map((emp) => {
            const stats = statsMap[emp.id] ?? { total: 0, familles: new Set<string>() };
            const hasContrat = stats.familles.has("Contrat");
            const hasCNI = stats.familles.has("CNI / Passeport");
            const hasCV = stats.familles.has("CV");
            const score = [hasContrat, hasCNI, hasCV].filter(Boolean).length;
            const dotColor =
              score === 3
                ? "bg-emerald-500"
                : score >= 1
                ? "bg-amber-400"
                : "bg-slate-200";

            const names = emp.full_name.trim().split(/\s+/);
            const initials =
              names.length >= 2
                ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
                : emp.full_name.slice(0, 2).toUpperCase();

            const isActif = !emp.statut || emp.statut === "actif";

            return (
              <Link
                key={emp.id}
                href={`/ged/${emp.id}`}
                className="group relative flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_-4px_rgba(99,102,241,0.15)] hover:border-indigo-200 transition-all duration-200"
              >
                {/* Indicateur complétude */}
                <div
                  className={`absolute top-4 right-4 h-2 w-2 rounded-full ${dotColor}`}
                  title={`${score}/3 pièces clés présentes`}
                />

                {/* Avatar + identité */}
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="font-semibold text-slate-800 text-sm truncate leading-tight group-hover:text-indigo-700 transition-colors">
                      {emp.full_name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{emp.poste}</p>
                    {emp.departement && (
                      <p className="text-[10px] text-slate-400 truncate">{emp.departement}</p>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    <FileText className="h-3 w-3" />
                    {stats.total} doc{stats.total !== 1 ? "s" : ""}
                  </span>
                  {hasContrat && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                      Contrat ✓
                    </span>
                  )}
                  {hasCNI && (
                    <span className="inline-flex items-center rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-pink-600">
                      CNI ✓
                    </span>
                  )}
                </div>

                {/* Pied de carte */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{emp.matricule}</span>
                    {!isActif && (
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-semibold text-rose-500 uppercase tracking-wide">
                        {emp.statut}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-500 group-hover:text-indigo-700 flex items-center gap-1 transition-colors">
                    Dossier
                    <svg
                      className="h-3.5 w-3.5 translate-x-0 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
