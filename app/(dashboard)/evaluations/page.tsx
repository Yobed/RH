export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import PerformanceReviewManager from "@/components/rh/PerformanceReviewManager";
import { Suspense } from "react";

export const metadata = { title: "Performance & Évaluations — RH Manager CI" };

export default async function EvaluationsPage() {
  const supabase = createServerClient();

  const [{ data: evaluations }, { data: employees }] = await Promise.all([
    supabase
      .from("evaluations")
      .select(`
        *,
        employees:employee_id (full_name, poste)
      `)
      .order("date_prevue", { ascending: false }),
    supabase
      .from("employees")
      .select("id, full_name, poste")
      .eq("statut", "actif")
      .order("full_name"),
  ]);

  const formattedEvaluations = (evaluations || []).map((ev: any) => ({
    ...ev,
    employee_name: ev.employees?.full_name || 'Inconnu',
    employee_role: ev.employees?.poste || 'N/A'
  }));

  return (
    <div className="p-6">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <PerformanceReviewManager 
          initialEvaluations={formattedEvaluations} 
          employees={employees ?? []} 
        />
      </Suspense>
    </div>
  );
}
