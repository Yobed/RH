import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requirePortailContext } from "@/lib/portail";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("signature_requests")
    .select("id, doc_type, titre, description, document_url, reference, status, expire_le, created_at, signed_at, refused_at, refus_motif")
    .eq("employee_id", ctx.employeeId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
