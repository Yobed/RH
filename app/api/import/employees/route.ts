import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

function parseDate(raw: string | number | undefined): string | null {
  if (!raw) return null;
  if (typeof raw === "number") {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(raw);
    if (!date) return null;
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  const str = String(raw).trim();
  // DD/MM/YYYY
  const ddmm = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2, "0")}-${ddmm[1].padStart(2, "0")}`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return null;
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: "Entreprise introuvable" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  if (rows.length === 0) {
    return NextResponse.json({ error: "Fichier vide" }, { status: 400 });
  }

  const errors: string[] = [];
  const toUpsert: Record<string, unknown>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const full_name = String(row["full_name"] ?? "").trim();
    const date_embauche_raw = row["date_embauche"];
    const salaire_brut = parseFloat(String(row["salaire_brut"] ?? "0").replace(/\s/g, ""));
    const type_contrat = String(row["type_contrat"] ?? "CDI").trim().toUpperCase();

    if (!full_name) { errors.push(`Ligne ${rowNum}: full_name manquant`); continue; }
    if (!date_embauche_raw) { errors.push(`Ligne ${rowNum}: date_embauche manquante`); continue; }
    if (isNaN(salaire_brut) || salaire_brut <= 0) { errors.push(`Ligne ${rowNum}: salaire_brut invalide`); continue; }
    if (!["CDI", "CDD"].includes(type_contrat)) { errors.push(`Ligne ${rowNum}: type_contrat doit être CDI ou CDD`); continue; }

    const date_embauche = parseDate(date_embauche_raw as string | number);
    if (!date_embauche) { errors.push(`Ligne ${rowNum}: date_embauche invalide (utiliser DD/MM/YYYY)`); continue; }

    const genre = String(row["genre"] ?? "M").trim().toUpperCase();

    toUpsert.push({
      company_id: profile.company_id,
      matricule: String(row["matricule"] ?? "").trim() || null,
      full_name,
      genre: ["M", "F"].includes(genre) ? genre : "M",
      date_naissance: parseDate(row["date_naissance"] as string | number),
      date_embauche,
      type_contrat: type_contrat as "CDI" | "CDD",
      poste: String(row["poste"] ?? "").trim() || "Non défini",
      departement: String(row["departement"] ?? "").trim() || null,
      categorie: String(row["categorie"] ?? "").trim() || null,
      salaire_brut,
      statut: String(row["statut"] ?? "actif").trim().toLowerCase() === "inactif" ? "inactif" : "actif",
      email: String(row["email"] ?? "").trim() || null,
      telephone: String(row["telephone"] ?? "").trim() || null,
    });
  }

  if (errors.length > 0 && toUpsert.length === 0) {
    return NextResponse.json({ error: "Données invalides", details: errors }, { status: 422 });
  }

  const { error: upsertError } = await supabase
    .from("employees")
    .upsert(toUpsert, { onConflict: "company_id,matricule", ignoreDuplicates: false });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: toUpsert.length,
    skipped: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
