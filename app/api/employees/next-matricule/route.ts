import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: companyId, error: companyError } = await supabase.rpc("get_user_company_id");
  if (companyError || !companyId) {
    return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });
  }

  const year = new Date().getFullYear();
  const prefix = `CI-${year}-`;

  const { data: employees } = await supabase
    .from("employees")
    .select("matricule")
    .eq("company_id", companyId)
    .like("matricule", `${prefix}%`)
    .order("matricule", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (employees && employees.length > 0) {
    const lastNum = parseInt(employees[0].matricule.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  const matricule = `${prefix}${String(nextNum).padStart(3, "0")}`;
  return NextResponse.json({ matricule });
}

