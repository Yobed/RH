import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generateAttestationPDF,
  generateCertificatPDF,
  generateDpaePDF,
  type CompanyInfo,
} from "@/lib/pdf-templates";

export const dynamic = "force-dynamic";

const schema = z.object({
  employee_id: z.string().uuid(),
  doc_type: z.enum([
    "certificat_travail",
    "attestation_travail",
    "attestation_salaire",
    "dpae",
  ]),
});

export async function POST(req: Request): Promise<NextResponse> {
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
  const { employee_id, doc_type } = parsed.data;

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const [{ data: company }, { data: employee }] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, raison_sociale, adresse, ncc, cnps_matricule, convention_collective, nccm, code_naf, adresse_paie, contact_paie")
      .eq("id", companyId as string)
      .single(),
    supabase
      .from("employees")
      .select("id, full_name, matricule, num_cnps, num_cni, date_naissance, lieu_naissance, date_embauche, poste, type_contrat, salaire_brut, adresse, phone")
      .eq("id", employee_id)
      .single(),
  ]);

  if (!employee) {
    return NextResponse.json({ error: "Salarié introuvable" }, { status: 404 });
  }

  const companyInfo = company as CompanyInfo | null;

  let doc;
  let filename: string;
  switch (doc_type) {
    case "certificat_travail":
      doc = generateCertificatPDF({ employee, company: companyInfo });
      filename = `certificat_travail_${employee.matricule}.pdf`;
      break;
    case "attestation_travail":
      doc = generateAttestationPDF({ employee, company: companyInfo, type: "travail" });
      filename = `attestation_travail_${employee.matricule}.pdf`;
      break;
    case "attestation_salaire":
      doc = generateAttestationPDF({ employee, company: companyInfo, type: "salaire" });
      filename = `attestation_salaire_${employee.matricule}.pdf`;
      break;
    case "dpae":
      doc = generateDpaePDF({ employee, company: companyInfo });
      filename = `dpae_${employee.matricule}.pdf`;
      break;
  }

  // Archiver dans generated_documents
  await supabase.from("generated_documents").insert({
    company_id: companyId as string,
    employee_id,
    doc_type,
    reference: filename,
    metadata: { generated_at: new Date().toISOString() },
    created_by: user.id,
  });

  // Audit
  await supabase.from("audit_logs").insert({
    action: "GENERATE_DOCUMENT",
    company_id: companyId as string,
    user_id: user.id,
    resource: `documents:${doc_type}:${employee_id}`,
  });

  const arrayBuffer = doc.output("arraybuffer");
  return new NextResponse(arrayBuffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
