import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Société introuvable" }, { status: 404 });

  const { data: company } = await supabase
    .from("companies")
    .select("api_key")
    .eq("id", companyId as string)
    .single();

  return NextResponse.json({ api_key: company?.api_key ?? null });
}

export async function POST() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["admin", "responsable_rh"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Société introuvable" }, { status: 404 });

  const newKey = `rh_${crypto.randomBytes(32).toString("hex")}`;

  const { error } = await supabase
    .from("companies")
    .update({ api_key: newKey })
    .eq("id", companyId as string);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ api_key: newKey });
}
