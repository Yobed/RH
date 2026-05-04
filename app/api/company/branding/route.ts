import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) {
    return NextResponse.json({ error: "Société introuvable" }, { status: 404 });
  }

  const body: unknown = await req.json();
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { logo_url, couleur_primaire, couleur_secondaire } = body as Record<string, unknown>;

  const updates: Record<string, string> = {};
  if (typeof logo_url === "string") updates.logo_url = logo_url;
  if (typeof couleur_primaire === "string") updates.couleur_primaire = couleur_primaire;
  if (typeof couleur_secondaire === "string") updates.couleur_secondaire = couleur_secondaire;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  const { error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", companyId as string);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) {
    return NextResponse.json({ error: "Société introuvable" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const contentType = file.type || "image/png";

  const { data, error: uploadError } = await supabase.storage
    .from("company-logos")
    .upload(`${companyId as string}/logo.png`, uint8, {
      upsert: true,
      contentType,
    });

  if (uploadError || !data) {
    return NextResponse.json({ error: uploadError?.message ?? "Erreur upload" }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from("company-logos")
    .getPublicUrl(data.path);

  const { error: updateError } = await supabase
    .from("companies")
    .update({ logo_url: publicUrl })
    .eq("id", companyId as string);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, logo_url: publicUrl });
}
