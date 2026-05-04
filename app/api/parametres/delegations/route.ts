import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  const { data } = await supabase
    .from("manager_delegations")
    .select("*, delegant:profiles!delegant_id(full_name), delegataire:profiles!delegataire_id(full_name)")
    .eq("company_id", companyId as string)
    .order("date_debut", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  const body = await req.json() as {
    delegataire_id: string; date_debut: string; date_fin: string; modules: string[];
  };

  const { error } = await supabase.from("manager_delegations").insert({
    company_id: companyId as string,
    delegant_id: user.id,
    delegataire_id: body.delegataire_id,
    date_debut: body.date_debut,
    date_fin: body.date_fin,
    modules: body.modules,
    actif: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  const { error } = await supabase
    .from("manager_delegations")
    .update({ actif: false })
    .eq("id", id)
    .eq("delegant_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
