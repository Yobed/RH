import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "responsable_rh"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  
  const action = searchParams.get("action");
  const entityType = searchParams.get("entity_type");
  const search = searchParams.get("search");

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (action && action !== "all") {
    query = query.eq("action", action);
  }

  if (entityType && entityType !== "all") {
    query = query.eq("entity_type", entityType);
  }

  if (search) {
    query = query.or(`user_name.ilike.%${search}%,user_email.ilike.%${search}%,user_role.ilike.%${search}%,entity_id.ilike.%${search}%`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: data ?? [],
    count: count ?? 0,
  });
}

