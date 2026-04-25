import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { grok, GROK_MODEL } from "@/lib/grok";

export const dynamic = 'force-dynamic';

const schema = z.object({
  type_document: z.enum([
    "convocation_entretien_prealable",
    "lettre_licenciement_personnel",
    "lettre_licenciement_economique",
    "mise_en_demeure_abandon_poste",
    "avertissement",
    "lettre_demission_acceptee",
    "attestation_travail",
    "attestation_salaire",
    "lettre_fin_cdd",
    "lettre_renouvellement_essai",
  ]),
  employee_id: z.string().uuid(),
  contexte: z.string().max(1000).optional(),
});

const DOCUMENT_LABELS: Record<string, string> = {
  convocation_entretien_prealable: "Convocation à entretien préalable de licenciement",
  lettre_licenciement_personnel: "Lettre de licenciement pour motif personnel",
  lettre_licenciement_economique: "Lettre de licenciement pour motif économique",
  mise_en_demeure_abandon_poste: "Mise en demeure pour abandon de poste",
  avertissement: "Lettre d'avertissement",
  lettre_demission_acceptee: "Accusé de réception de démission",
  attestation_travail: "Attestation de travail",
  attestation_salaire: "Attestation de salaire",
  lettre_fin_cdd: "Lettre de fin de CDD",
  lettre_renouvellement_essai: "Lettre de renouvellement de période d'essai",
};

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

  const { type_document, employee_id, contexte } = parsed.data;

  const [employeeRes, companyRes] = await Promise.all([
    supabase
      .from("employees")
      .select("full_name, poste, date_embauche, type_contrat, salaire_brut, matricule, categorie")
      .eq("id", employee_id)
      .single(),
    supabase
      .from("profiles")
      .select("company_id, companies(name, raison_sociale, adresse, cnps_matricule, ncc)")
      .eq("id", user.id)
      .single(),
  ]);

  if (!employeeRes.data) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

  const emp = employeeRes.data as typeof employeeRes.data & { salaire_brut?: number | null; categorie?: string | null };
  type CompanyInfo = { name: string; raison_sociale: string | null; adresse: string | null; cnps_matricule: string | null; ncc: string | null };
  const companiesRaw = companyRes.data?.companies;
  const company = (Array.isArray(companiesRaw) ? companiesRaw[0] : companiesRaw) as CompanyInfo | null;

  const today = new Date().toLocaleDateString("fr-CI", { day: "2-digit", month: "long", year: "numeric" });

  const systemPrompt = `Tu es un expert RH et juriste ivoirien spécialisé dans la rédaction de documents professionnels conformes au Code du Travail de Côte d'Ivoire (Loi n°2015-532).

Règles absolues :
- Rédige uniquement en français, avec un ton formel et professionnel
- Respecte scrupuleusement les formes légales ivoiriennes
- Utilise les mentions légales obligatoires (articles de loi, délais légaux)
- Adapte le document aux données réelles de l'employé fournies
- Génère UNIQUEMENT le texte du document, sans explications ni commentaires
- Utilise le format : en-tête société | Abidjan, [date] | destinataire | objet | corps | formule de politesse | signature`;

  const userPrompt = `Rédige un(e) "${DOCUMENT_LABELS[type_document]}" avec les informations suivantes :

**Société émettrice :**
- Raison sociale : ${company?.raison_sociale ?? company?.name ?? "RH Manager CI"}
- Adresse : ${company?.adresse ?? "Abidjan, Côte d'Ivoire"}
- N° CNPS : ${company?.cnps_matricule ?? "—"}

**Employé concerné :**
- Nom complet : ${emp.full_name}
- Matricule : ${emp.matricule ?? "—"}
- Poste : ${emp.poste}
- Type de contrat : ${emp.type_contrat ?? "CDI"}
- Date d'embauche : ${emp.date_embauche ? new Date(emp.date_embauche).toLocaleDateString("fr-CI") : "—"}
- Salaire de base : ${emp.salaire_brut ? emp.salaire_brut.toLocaleString("fr-CI") + " FCFA" : "—"}
- Catégorie : ${emp.categorie ?? "—"}

**Date du document :** ${today}
${contexte ? `\n**Contexte/motifs supplémentaires :** ${contexte}` : ""}

Génère le document complet, formel et conforme au droit du travail ivoirien.`;

  try {
    const completion = await grok.chat.completions.create({
      model: GROK_MODEL,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const document = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({
      document,
      type_document,
      label: DOCUMENT_LABELS[type_document],
      employee: emp.full_name,
    });
  } catch {
    return NextResponse.json({ error: "Erreur génération IA" }, { status: 502 });
  }
}
