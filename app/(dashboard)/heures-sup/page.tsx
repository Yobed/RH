import { PageShell } from "@/components/ui/page-shell";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OvertimeManager } from "@/components/rh/OvertimeManager";
import { Suspense } from "react";

export const metadata = { title: "Heures supplémentaires — RH Manager CI" };

export default async function HeuresSupPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) redirect("/onboarding");

  const [{ data: employees }, { data: records }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, salaire_brut")
      .eq("company_id", profile.company_id)
      .eq("statut", "actif")
      .order("full_name"),
    supabase
      .from("overtime_records")
      .select("*, employee:employees(full_name, matricule)")
      .eq("company_id", profile.company_id)
      .order("date", { ascending: false })
      .limit(200),
  ]);

  return (
    <PageShell>
      <Suspense fallback={
        <div className="rounded-lg border border-slate-200 bg-white p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <p className="text-xs text-slate-500 font-medium">Chargement…</p>
          </div>
        </div>
      }>
        <OvertimeManager
          employees={employees || []}
          initialRecords={records || []}
          companyId={profile.company_id}
        />
      </Suspense>
    </PageShell>
  );
}
