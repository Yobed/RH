import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024;

const TYPES_CONGE = ["annuel", "maladie", "maternite", "paternite", "sans_solde", "exceptionnel"] as const;

const baseSchema = z.object({
  employee_id: z.string().uuid(),
  type: z.enum(TYPES_CONGE),
  date_debut: z.string().min(1),
  date_fin: z.string().min(1),
  nb_jours: z.coerce.number().positive(),
  commentaire: z.string().max(500).optional(),
  conge_fractionne: z.union([z.boolean(), z.string().transform(v => v === "true")]).optional(),
  date_reprise: z.string().nullable().optional(),
  remplacant_id: z.string().uuid().nullable().optional(),
});

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("conges")
    .select(`id, type, date_debut, date_fin, nb_jours, statut, commentaire, created_at,
             employees(full_name, poste, matricule)`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile?.company_id) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

  const contentType = req.headers.get("content-type") ?? "";
  let fields: Record<string, string> = {};
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    for (const [key, val] of Array.from(fd.entries())) {
      if (typeof val === "string") fields[key] = val;
    }
    const uploaded = fd.get("justificatif");
    if (uploaded instanceof File && uploaded.size > 0) file = uploaded;
  } else {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    fields = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k, v == null ? "" : String(v)])
    );
  }

  const parsed = baseSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // Upload justificatif si présent
  let justificatif_url: string | null = null;
  let est_justifie = false;

  if (file) {
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: "Format fichier invalide. Acceptés : PDF, JPEG, PNG." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)." }, { status: 400 });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `documents/${profile.company_id}/${parsed.data.employee_id}/Conges/${timestamp}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const admin = createAdminClient();

    const { error: uploadError } = await admin.storage
      .from("rh-documents")
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: "Erreur upload justificatif.", details: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from("rh-documents").getPublicUrl(storagePath);
    justificatif_url = urlData.publicUrl;
    est_justifie = true;

    // GED
    await admin.from("documents").insert({
      company_id: profile.company_id,
      employee_id: parsed.data.employee_id,
      name: `Justificatif congé ${parsed.data.type} - ${parsed.data.date_debut}`,
      famille: "Congés",
      file_url: justificatif_url,
      file_type: file.type,
      file_size_kb: Math.round(file.size / 1024),
    });
  }

  const { data, error } = await supabase
    .from("conges")
    .insert({
      ...parsed.data,
      company_id: profile.company_id,
      statut: "en_attente",
      justificatif_url,
      est_justifie,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent({
    action: "create",
    entity_type: "conge",
    entity_id: data.id,
    new_values: data,
  });

  return NextResponse.json(data, { status: 201 });
}
