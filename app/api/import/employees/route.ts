import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";
import { logAuditEvent } from "@/lib/audit";

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

function parseSalary(val: unknown): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  // Retire tous les espaces, espacements insécables, "F", "C", "A"
  let s = String(val).toUpperCase().replace(/[\s\uFEFF\xA0FCFA]/g, "");
  // Remplace la virgule par un point
  s = s.replace(",", ".");
  // Gestion format français avec multiples points (ex: 1.500.000)
  const parts = s.split(".");
  if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
    s = parts.join("");
  }
  const parsed = parseFloat(s);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
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
    const salaire_brut = parseSalary(row["salaire_brut"]);
    const type_contrat = String(row["type_contrat"] ?? "CDI").trim().toUpperCase();

    if (!full_name) { errors.push(`Ligne ${rowNum}: full_name manquant`); continue; }
    if (!date_embauche_raw) { errors.push(`Ligne ${rowNum}: date_embauche manquante`); continue; }
    if (isNaN(salaire_brut) || salaire_brut <= 0) { errors.push(`Ligne ${rowNum}: salaire_brut invalide`); continue; }
    const allowedTypes = ["CDI", "CDD", "STAGE", "APPRENTISSAGE"];
    if (!allowedTypes.includes(type_contrat)) { 
      errors.push(`Ligne ${rowNum}: type_contrat '${type_contrat}' invalide. Attendus: ${allowedTypes.join(', ')}`); 
      continue; 
    }

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
      type_contrat: type_contrat as "CDI" | "CDD" | "STAGE" | "APPRENTISSAGE",
      poste: String(row["poste"] ?? "").trim() || "Non défini",
      departement: String(row["departement"] ?? "").trim() || null,
      categorie: String(row["categorie"] ?? "").trim() || null,
      salaire_brut,
      sursalaire: parseSalary(row["sursalaire"]),
      prime_transport: parseSalary(row["prime_transport"]),
      nb_enfants: row["nb_enfants"] ? parseInt(String(row["nb_enfants"]), 10) || 0 : 0,
      nationalite: String(row["nationalite"] ?? "").trim() || null,
      etat_civil: String(row["etat_civil"] ?? "").trim() || null,
      statut: String(row["statut"] ?? "actif").trim().toLowerCase() === "inactif" ? "inactif" : "actif",
      email: String(row["email"] ?? "").trim() || null,
      phone: String(row["telephone"] ?? row["phone"] ?? "").trim() || null,
    });
  }

  if (errors.length > 0 && toUpsert.length === 0) {
    return NextResponse.json({ error: "Données invalides", details: errors }, { status: 422 });
  }

  const { data: upsertedData, error: upsertError } = await supabase
    .from("employees")
    .upsert(toUpsert, { onConflict: "company_id,matricule", ignoreDuplicates: false })
    .select("id, matricule, type_contrat, salaire_brut, date_embauche");

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // --- Synchronisation des Contrats ---
  if (upsertedData && upsertedData.length > 0) {
    // Préparer les contrats pour TOUS les employés importés qui ont un salaire
    // On utilise un upsert sur la table contracts (conflit sur employee_id)
    const contractsToUpsert = upsertedData
      .filter(emp => emp.salaire_brut > 0 && emp.type_contrat)
      .map(emp => ({
        company_id: profile.company_id,
        employee_id: emp.id,
        type_contrat: emp.type_contrat,
        date_debut: emp.date_embauche || new Date().toISOString().split('T')[0],
        salaire_brut: Number(emp.salaire_brut),
        statut: "actif",
        renouvellement_count: 0
      }));

    if (contractsToUpsert.length > 0) {
      const { error: contractError } = await supabase
        .from("contracts")
        .upsert(contractsToUpsert, { onConflict: "employee_id" });
      
      if (contractError) {
        console.error("[import/employees] Error upserting contracts:", contractError);
      }
    }
  }

  try {
    await logAuditEvent({
      action: "upload",
      entity_type: "employees",
      details: {
        imported: toUpsert.length,
        skipped: errors.length,
        filename: file.name,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      },
    });
  } catch {
    // L'audit ne doit jamais bloquer la réponse
  }

  return NextResponse.json({
    imported: toUpsert.length,
    skipped: errors.length,
    errors: errors.length > 0 ? errors : undefined,
    contractsSync: true
  });
}
