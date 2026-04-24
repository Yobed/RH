import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OvertimeManager } from "@/components/rh/OvertimeManager";
import { SidebarNav } from "@/components/rh/SidebarNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default async function HeuresSupPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch company
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    redirect("/onboarding");
  }

  // Fetch employees for selection
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, matricule, salaire_brut")
    .eq("company_id", profile.company_id)
    .eq("statut", "actif")
    .order("full_name");

  // Fetch historical records
  const { data: records } = await supabase
    .from("overtime_records")
    .select("*, employee:employees(full_name, matricule)")
    .eq("company_id", profile.company_id)
    .order("date", { ascending: false })
    .limit(50);

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Heures Supplémentaires</h1>
              <p className="text-slate-500 mt-1">Gérez et calculez les heures extra de vos collaborateurs conformément au Code du Travail CI.</p>
            </div>
          </div>

          <OvertimeManager 
            employees={employees || []} 
            initialRecords={records || []}
            companyId={profile.company_id}
          />
        </div>
      </main>
    </div>
  );
}
