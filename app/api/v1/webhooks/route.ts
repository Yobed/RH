import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Société introuvable" }, { status: 404 });

  const { data: webhooks } = await supabase
    .from("webhooks")
    .select("id, name, url, events, secret, actif, last_triggered_at, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return NextResponse.json(webhooks ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Société introuvable" }, { status: 404 });

  const body = await req.json() as { name?: string; url?: string; events?: string[] };
  const { name, url, events } = body;

  if (!name || !url || !events?.length) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const { data: webhook, error } = await supabase
    .from("webhooks")
    .insert({ company_id: companyId, name, url, events })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ webhook });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const { error } = await supabase.from("webhooks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
