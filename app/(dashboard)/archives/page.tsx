export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { DocumentUploadDialog } from "@/components/rh/DocumentUploadDialog";
import { ArchivesControls } from "@/components/rh/ArchivesControls";
import { DocumentDeleteButton } from "@/components/rh/DocumentDeleteButton";
import { Archive, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Archives — RH Manager CI" };

const familleColors: Record<string, string> = {
  Contrat: "bg-blue-100 text-blue-700",
  Avenant: "bg-indigo-100 text-indigo-700",
  Diplômes: "bg-purple-100 text-purple-700",
  "CNI / Passeport": "bg-pink-100 text-pink-700",
  "Extrait de naissance": "bg-rose-100 text-rose-700",
  "Casier judiciaire": "bg-slate-100 text-slate-700",
  CV: "bg-cyan-100 text-cyan-700",
  Paie: "bg-green-100 text-green-700",
  Médical: "bg-red-100 text-red-700",
  Congés: "bg-amber-100 text-amber-700",
  Disciplinaire: "bg-orange-100 text-orange-700",
  "Demande d'explication": "bg-yellow-100 text-yellow-700",
  Formation: "bg-teal-100 text-teal-700",
  Autre: "bg-gray-100 text-gray-700",
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

export default async function ArchivesPage({ searchParams }: PageProps) {
  const supabase = createServerClient();
  const page = parseInt(searchParams.page || "1");
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .single();

  if (!profile?.company_id) return null;

  // Récupérer les employés pour le filtre
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("company_id", profile.company_id)
    .order("full_name");

  // Construire la requête de documents
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

  // Compter par famille (toujours globalement pour l'entreprise)
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
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archives</h1>
          <p className="text-muted-foreground mt-1">
            Gestion électronique des documents (GED) — Centralisation et conformité.
          </p>
        </div>
        <DocumentUploadDialog companyId={profile.company_id} />
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-7">
        {familles.slice(0, 7).map((f) => (
          <div key={f} className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-medium text-muted-foreground truncate">{f}</p>
            <p className="mt-2 text-2xl font-bold">{compteFamille[f] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* Barre de recherche et filtres */}
        <ArchivesControls 
          employees={employees || []} 
          familles={familles} 
        />

        {/* Liste des documents */}
        {!documents || documents.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-20 text-center animate-in fade-in zoom-in duration-300">
            <Archive className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">Aucun résultat</h3>
            <p className="text-muted-foreground mt-1 max-w-xs mx-auto">
              Nous n'avons trouvé aucun document correspondant à vos critères de recherche.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Document</th>
                  <th className="px-6 py-4 text-left font-semibold hidden md:table-cell">Employé</th>
                  <th className="px-6 py-4 text-left font-semibold">Famille</th>
                  <th className="px-6 py-4 text-left font-semibold hidden lg:table-cell text-right">Taille</th>
                  <th className="px-6 py-4 text-left font-semibold hidden lg:table-cell">Date d'import</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => {
                  const emp = Array.isArray(doc.employees) ? doc.employees[0] : doc.employees;
                  return (
                    <tr key={doc.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5 text-primary">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
                              {doc.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {doc.file_type?.split("/")[1] || "DOC"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground hidden md:table-cell font-medium">
                        {emp?.full_name ?? "Général"}
                      </td>
                      <td className="px-6 py-4">
                        {doc.famille && (
                          <Badge variant="secondary" className={`${familleColors[doc.famille]} border-none font-medium`}>
                            {doc.famille}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground hidden lg:table-cell font-mono tabular-nums">
                        {doc.file_size_kb ? `${doc.file_size_kb} Ko` : "—"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground hidden lg:table-cell">
                        {new Date(doc.created_at!).toLocaleDateString("fr-CI", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs">
                              Ouvrir
                            </a>
                          </Button>
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
              <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/10">
                <p className="text-xs text-muted-foreground">
                  Page <span className="font-bold text-foreground">{page}</span> sur <span className="font-bold text-foreground">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    asChild={page > 1}
                  >
                    {page > 1 ? (
                      <Link href={`?${new URLSearchParams({ ...searchParams, page: (page - 1).toString() })}`}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Précédent
                      </Link>
                    ) : (
                      <>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Précédent
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    asChild={page < totalPages}
                  >
                     {page < totalPages ? (
                      <Link href={`?${new URLSearchParams({ ...searchParams, page: (page + 1).toString() })}`}>
                        Suivant
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    ) : (
                      <>
                        Suivant
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
