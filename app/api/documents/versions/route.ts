import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const documentId = req.nextUrl.searchParams.get("documentId");
  if (!documentId) return NextResponse.json({ error: "documentId requis" }, { status: 400 });

  const { data: versions } = await supabase
    .from("document_versions")
    .select("*, uploader:uploaded_by(full_name)")
    .eq("document_id", documentId)
    .order("version", { ascending: false });

  return NextResponse.json(versions ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Société introuvable" }, { status: 404 });

  const body = await req.json() as {
    document_id: string;
    employee_id?: string;
    file_url: string;
    file_name: string;
    file_size?: number;
    commentaire?: string;
  };

  const { data: existing } = await supabase
    .from("document_versions")
    .select("version")
    .eq("document_id", body.document_id)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (existing?.version ?? 0) + 1;

  const { data: version, error } = await supabase
    .from("document_versions")
    .insert({
      document_id: body.document_id,
      company_id: companyId,
      employee_id: body.employee_id,
      version: nextVersion,
      file_url: body.file_url,
      file_name: body.file_name,
      file_size: body.file_size ?? 0,
      uploaded_by: user.id,
      commentaire: body.commentaire,
    })
    .select("*, uploader:uploaded_by(full_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ version });
}
