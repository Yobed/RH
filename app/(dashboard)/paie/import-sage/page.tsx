import { PageShell } from "@/components/ui/page-shell";
import { createServerClient } from "@/lib/supabase/server";
import { SageReconciliationClient } from "@/components/paie/SageReconciliationClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Import & Réconciliation Sage Paie — RH Manager CI" };

interface PayrollLogRow {
  employee_id: string;
  employee_name: string | null;
  periode: string | null;
  net_to_pay: number | null;
}

interface MappingRow {
  sage_employee_id: string;
  employee_id: string | null;
}

interface EmployeeRow {
  id: string;
  full_name: string;
  matricule: string | null;
}

export default async function ImportSagePage() {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle()
    : { data: null };

  const companyId: string | null = profile?.company_id ?? null;

  // Récupération des matricules Sage distincts avec dernière période
  const rawLogs: PayrollLogRow[] = [];
  if (companyId) {
    const { data } = await supabase
      .from("payroll_logs")
      .select("employee_id, employee_name, periode, net_to_pay")
      .eq("company_id", companyId)
      .order("periode", { ascending: false });

    if (data) {
      // Déduplique par employee_id — garde la première ligne (la plus récente grâce au tri)
      const seen = new Set<string>();
      for (const row of data as PayrollLogRow[]) {
        if (!seen.has(row.employee_id)) {
          seen.add(row.employee_id);
          rawLogs.push(row);
        }
      }
    }
  }

  // Mappings existants
  const mappings: MappingRow[] = [];
  if (companyId) {
    const { data } = await supabase
      .from("sage_employee_mapping")
      .select("sage_employee_id, employee_id")
      .eq("company_id", companyId);
    if (data) mappings.push(...(data as MappingRow[]));
  }

  // Employés actifs
  const employees: EmployeeRow[] = [];
  if (companyId) {
    const { data } = await supabase
      .from("employees")
      .select("id, full_name, matricule")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("full_name");
    if (data) employees.push(...(data as EmployeeRow[]));
  }

  const sageRows = rawLogs.map((row) => ({
    sage_employee_id: row.employee_id,
    employee_name: row.employee_name,
    last_periode: row.periode,
    last_net_to_pay: row.net_to_pay,
  }));

  return (
    <PageShell>
      <SageReconciliationClient
        sageRows={sageRows}
        employees={employees}
        initialMappings={mappings}
      />
    </PageShell>
  );
}
