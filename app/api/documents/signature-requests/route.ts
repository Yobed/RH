import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  employee_id: z.string().uuid(),
  doc_type: z.enum(["contrat", "avenant", "sanction", "stc", "reglement_interieur", "autre"]),
  titre: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  document_url: z.string().url().optional(),
  reference: z.string().max(80).optional(),
  expire_le: z.string().optional(),
});

export async function GET(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "salarie") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const url = new URL(req.url);
  const employeeId = url.searchParams.get("employee_id");
  const status = url.searchParams.get("status");

  let query = supabase
    .from("signature_requests")
    .select(`
      id, doc_type, titre, description, document_url, reference,
      status, expire_le, created_at, signed_at, refused_at, refus_motif,
      employee_id,
      employees!inner(full_name, matricule)
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (employeeId) query = query.eq("employee_id", employeeId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "salarie") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { employee_id, doc_type, titre, description, document_url, reference, expire_le } = parse.data;

  // Vérifier que l'employé appartient à la même entreprise
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employee_id)
    .eq("company_id", profile.company_id)
    .single();

  if (!emp) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

  const { data, error } = await supabase
    .from("signature_requests")
    .insert({
      company_id: profile.company_id,
      employee_id,
      doc_type,
      titre,
      description,
      document_url,
      reference,
      expire_le: expire_le ?? null,
      status: "en_attente",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log événement CREATED
  await supabase.from("signature_events").insert({
    request_id: data.id,
    event: "CREATED",
    user_id: user.id,
    metadata: { created_by_admin: true, doc_type, titre },
  });

  return NextResponse.json({ data }, { status: 201 });
}
