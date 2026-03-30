export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { DocumentUploadDialog } from "@/components/rh/DocumentUploadDialog";
import { Archive, FileText } from "lucide-react";

export const metadata = { title: "Archives — RH Manager CI" };

const familleColors: Record<string, string> = {
  Contrat: "bg-blue-100 text-blue-700",
  Diplômes: "bg-purple-100 text-purple-700",
  Paie: "bg-green-100 text-green-700",
  Médical: "bg-red-100 text-red-700",
  Congés: "bg-amber-100 text-amber-700",
  Disciplinaire: "bg-orange-100 text-orange-700",
  Formation: "bg-teal-100 text-teal-700",
  Autre: "bg-gray-100 text-gray-700",
};

export default async function ArchivesPage() {
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .single();

  const { data: documents } = await supabase
    .from("documents")
    .select(
      `id, name, famille, file_type, file_size_kb, created_at, file_url,
       employees(full_name)`
    )
    .order("created_at", { ascending: false })
    .limit(20);

  // Compter par famille
  const { data: parFamille } = await supabase
    .from("documents")
    .select("famille");

  const compteFamille: Record<string, number> = {};
  parFamille?.forEach(({ famille }) => {
    if (famille) compteFamille[famille] = (compteFamille[famille] ?? 0) + 1;
  });

  const familles = [
    "Contrat", "Diplômes", "Paie", "Médical",
    "Congés", "Disciplinaire", "Formation", "Autre",
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Archives</h1>
          <p className="text-sm text-muted-foreground">
            Gestion documentaire — Structure : documents/{"{company_id}/{employee_id}/{famille}"}
          </p>
        </div>
        {profile?.company_id && (
          <DocumentUploadDialog companyId={profile.company_id} />
        )}
      </div>

      {/* Répartition par famille */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Répartition par famille</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {familles.map((famille) => (
            <div
              key={famille}
              className="flex items-center justify-between rounded-lg border bg-white px-3 py-2.5"
            >
              <span className={`text-xs font-medium rounded px-1.5 py-0.5 ${familleColors[famille] ?? "bg-gray-100 text-gray-700"}`}>
                {famille}
              </span>
              <span className="text-sm font-bold text-muted-foreground">
                {compteFamille[famille] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Documents récents */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Documents récents</h2>
        {!documents || documents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Archive className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Aucun document archivé</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les documents seront listés ici après upload via les fiches employés.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Document</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Employé</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Famille</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden lg:table-cell">Taille</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Fichier</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => {
                  const employee = Array.isArray(doc.employees) ? doc.employees[0] : doc.employees;
                  return (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[180px]">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {employee?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {doc.famille && (
                          <span className={`text-xs font-medium rounded px-1.5 py-0.5 ${familleColors[doc.famille] ?? "bg-gray-100 text-gray-700"}`}>
                            {doc.famille}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">
                        {doc.file_size_kb != null ? `${doc.file_size_kb} Ko` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {new Date(doc.created_at!).toLocaleDateString("fr-CI")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Ouvrir
                        </a>
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
