export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { DocumentUploadDialog } from "@/components/rh/DocumentUploadDialog";
import { ArchivesControls } from "@/components/rh/ArchivesControls";
import { DocumentDeleteButton } from "@/components/rh/DocumentDeleteButton";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import Link from "next/link";

export const metadata = { title: "Archives — RH Manager CI" };

const familleColors: Record<string, string> = {
  Contrat: "bg-teal-100 text-teal-700",
  Avenant: "bg-teal-100 text-teal-700",
  Diplômes: "bg-slate-100 text-slate-700",
  "CNI / Passeport": "bg-pink-100 text-pink-700",
  "Extrait de naissance": "bg-rose-100 text-rose-700",
  "Casier judiciaire": "bg-slate-100 text-slate-600",
  CV: "bg-cyan-100 text-cyan-700",
  Paie: "bg-green-100 text-green-700",
  Médical: "bg-red-100 text-red-700",
  Congés: "bg-amber-100 text-amber-700",
  Disciplinaire: "bg-orange-100 text-orange-700",
  "Demande d'explication": "bg-yellow-100 text-yellow-700",
  Formation: "bg-teal-100 text-teal-700",
  Autre: "bg-gray-100 text-gray-600",
};

const ITEMS_PER_PAGE = 10;

interface PageProps {
  searchParams: {
    q?: string;
    famille?: string;
    employeeId?: string;
    page?: string;
  };
}

function fileExtColor(fileType: string | null): string {
  if (!fileType) return "bg-slate-100 text-slate-600";
  if (fileType.includes("pdf")) return "bg-rose-50 text-rose-600";
  if (fileType.includes("word") || fileType.includes("doc")) return "bg-teal-50 text-teal-600";
  if (fileType.includes("image") || fileType.includes("png") || fileType.includes("jpg")) return "bg-slate-50 text-slate-600";
  if (fileType.includes("sheet") || fileType.includes("xls") || fileType.includes("csv")) return "bg-emerald-50 text-emerald-600";
  return "bg-slate-50 text-slate-600";
}

export default async function ArchivesPage({ searchParams }: PageProps) {
  const supabase = createServerClient();
  const page = parseInt(searchParams.page || "1");
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .single();

  if (!profile?.company_id) return null;

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("company_id", profile.company_id)
    .order("full_name");

  let query = supabase
    .from("documents")
    .select("id, name, famille, file_type, file_size_kb, created_at, file_url, employees(full_name)", { count: "exact" })
    .eq("company_id", profile.company_id);

  if (searchParams.q) {
    query = query.ilike("name", `%${searchParams.q}%`);
  }
  if (searchParams.famille && searchParams.famille !== "all") {
    query = query.eq("famille", searchParams.famille);
  }
  if (searchParams.employeeId && searchParams.employeeId !== "all") {
    query = query.eq("employee_id", searchParams.employeeId);
  }

  const { data: documents, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

  const { data: parFamille } = await supabase
    .from("documents")
    .select("famille")
    .eq("company_id", profile.company_id);

  const compteFamille: Record<string, number> = {};
  parFamille?.forEach(({ famille }) => {
    if (famille) compteFamille[famille] = (compteFamille[famille] ?? 0) + 1;
  });

  const familles = Object.keys(familleColors);

  return (
    <PageShell>
      <PageHeader
        title="Archives"
        description="Vue globale de tous les documents — recherche, filtrage et téléchargement."
        actions={<DocumentUploadDialog companyId={profile.company_id} />}
      />

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {familles.slice(0, 7).map((f) => (
          <div
            key={f}
            className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-4 hover:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.08)] transition-shadow"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 truncate">{f}</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">{compteFamille[f] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* Filtres */}
        <ArchivesControls
          employees={employees || []}
          familles={familles}
        />

        {/* Liste des documents */}
        {!documents || documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
              <svg className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Aucun résultat</h3>
            <p className="mt-1 text-sm text-slate-600 max-w-xs mx-auto">
              Nous n&apos;avons trouvé aucun document correspondant à vos critères.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Document</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden md:table-cell">Employé</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Famille</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden lg:table-cell text-right">Taille</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {documents.map((doc) => {
                  const emp = Array.isArray(doc.employees) ? doc.employees[0] : doc.employees;
                  const extLabel = doc.file_type?.split("/")[1]?.toUpperCase() || "DOC";
                  const extColor = fileExtColor(doc.file_type);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${extColor}`}>
                            {extLabel.slice(0, 3)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-800 truncate max-w-[180px] group-hover:text-[oklch(0.175_0.04_248)] transition-colors">
                              {doc.name}
                            </span>
                            <span className="text-[10px] text-slate-600 font-medium">
                              {doc.file_type?.split("/")[1]?.toUpperCase() || "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-slate-600 font-medium">{emp?.full_name ?? "Général"}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {doc.famille && (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${familleColors[doc.famille]}`}>
                            {doc.famille}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-right">
                        <span className="text-xs text-slate-600 font-mono tabular-nums">
                          {doc.file_size_kb ? `${doc.file_size_kb} Ko` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-slate-600">
                          {new Date(doc.created_at!).toLocaleDateString("fr-CI", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Ouvrir
                          </a>
                          <DocumentDeleteButton documentId={doc.id} documentName={doc.name} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/40">
                <p className="text-xs text-slate-600">
                  Page <span className="font-semibold text-slate-700">{page}</span> sur{" "}
                  <span className="font-semibold text-slate-700">{totalPages}</span>
                </p>
                <div className="flex gap-1.5">
                  {page > 1 ? (
                    <Link
                      href={`?${new URLSearchParams({ ...searchParams, page: (page - 1).toString() })}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Précédent
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-300 cursor-not-allowed">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Précédent
                    </span>
                  )}
                  {page < totalPages ? (
                    <Link
                      href={`?${new URLSearchParams({ ...searchParams, page: (page + 1).toString() })}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                      Suivant
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-300 cursor-not-allowed">
                      Suivant
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
