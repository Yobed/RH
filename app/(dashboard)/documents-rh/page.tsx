import { PageShell } from "@/components/ui/page-shell";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { DocumentsRhClient } from "./DocumentsRhClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Documents RH — RH Manager CI" };

export default async function DocumentsRhPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) redirect("/onboarding");

  const [{ data: employees }, { data: history }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, poste, statut")
      .eq("company_id", companyId as string)
      .order("full_name"),
    supabase
      .from("generated_documents")
      .select("id, employee_id, doc_type, reference, created_at, employees(full_name, matricule)")
      .eq("company_id", companyId as string)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Aplatir : Supabase peut typer la relation comme un array (FK 1-1 avec embed)
  const flattenedHistory = (history ?? []).map((h) => {
    const emp = Array.isArray(h.employees) ? h.employees[0] : h.employees;
    return { ...h, employees: emp ?? null };
  });

  return (
    <PageShell>
      <DocumentsRhClient
        employees={employees ?? []}
        history={flattenedHistory}
      />
    </PageShell>
  );
}
