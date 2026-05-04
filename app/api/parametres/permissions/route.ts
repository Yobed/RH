import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  const { data } = await supabase
    .from("role_permissions")
    .select("*")
    .eq("company_id", companyId as string);

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  const permissions = await req.json() as Array<{
    role: string; module: string;
    can_read: boolean; can_write: boolean; can_delete: boolean; can_export: boolean;
  }>;

  const toUpsert = permissions.map((p) => ({ ...p, company_id: companyId as string }));
  const { error } = await supabase.from("role_permissions").upsert(toUpsert, {
    onConflict: "company_id,role,module",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
