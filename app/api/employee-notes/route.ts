import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  employee_id: z.string().uuid(),
  kind: z.enum(["note", "message"]),
  body: z.string().min(1, "Texte requis").max(4000),
});

export async function GET(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employee_id");
  if (!employeeId) return NextResponse.json({ error: "employee_id manquant" }, { status: 400 });

  const { data, error } = await supabase
    .from("employee_notes")
    .select("id, kind, body, created_at, author_id")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const authorIds = Array.from(new Set((data ?? []).map((n) => n.author_id).filter(Boolean) as string[]));
  let authors: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);
    authors = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name ?? "Utilisateur"]));
  }

  const enriched = (data ?? []).map((n) => ({
    ...n,
    author_name: n.author_id ? authors[n.author_id] ?? "Utilisateur" : "Système",
  }));

  return NextResponse.json({ notes: enriched });
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });

  const { data: companyId, error: cErr } = await supabase.rpc("get_user_company_id");
  if (cErr || !companyId) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });

  const { data, error } = await supabase
    .from("employee_notes")
    .insert({
      company_id: companyId as string,
      employee_id: parsed.data.employee_id,
      kind: parsed.data.kind,
      body: parsed.data.body,
      author_id: user.id,
    })
    .select("id, kind, body, created_at, author_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ note: data }, { status: 201 });
}
