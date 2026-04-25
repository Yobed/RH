export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OvertimeManager } from "@/components/rh/OvertimeManager";

export const metadata = { title: "Heures Supplémentaires — RH Manager CI" };

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
      .limit(50),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Heures Supplémentaires</h1>
          <p className="text-sm text-slate-600 mt-0.5 font-medium">
            Calcul et gestion conformément au Code du Travail CI
          </p>
        </div>
      </div>

      <OvertimeManager
        employees={employees || []}
        initialRecords={records || []}
        companyId={profile.company_id}
      />
    </div>
  );
}
