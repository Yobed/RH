import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const schema = z.object({
  recipient_id: z.string().uuid(),
  sujet: z.string().max(200).optional(),
  corps: z.string().min(1).max(5000),
  type: z.enum(["message", "notification"]).optional(),
  meta: z.record(z.unknown()).optional(),
});

export async function GET(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const box = searchParams.get("box") ?? "inbox";

  const query = supabase
    .from("messages")
    .select(`id, sujet, corps, lu, type, meta, created_at,
             sender:sender_id(id, full_name, avatar_url),
             recipient:recipient_id(id, full_name, avatar_url)`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (box === "inbox") {
    query.eq("recipient_id", user.id);
  } else {
    query.eq("sender_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

  const { data, error } = await supabase
    .from("messages")
    .insert({
      ...parsed.data,
      sender_id: user.id,
      company_id: profile.company_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
