import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import type { TemplateData } from "@/lib/templates/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await req.json()) as {
    template_id: string;
    employee_id: string;
    variables_custom?: Record<string, string>;
  };

  const { template_id, employee_id, variables_custom = {} } = body;
  if (!template_id || !employee_id) {
    return NextResponse.json({ error: "template_id et employee_id requis" }, { status: 400 });
  }

  const template = getTemplate(template_id);
  if (!template) {
    return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
  }

  const [{ data: emp }, { data: profile }] = await Promise.all([
    supabase
      .from("employees")
      .select("full_name, matricule, poste, departement, date_embauche, type_contrat, salaire_brut, categorie, genre")
      .eq("id", employee_id)
      .single(),
    supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single(),
  ]);

  if (!emp) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

  let entreprise = {
    nom: "Votre Entreprise",
    adresse: "Abidjan, Côte d'Ivoire",
    cnps: "—",
    ville: "Abidjan",
  };

  if (profile?.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("name, address, city, cnps_number")
      .eq("id", profile.company_id)
      .single();
    if (company) {
      entreprise = {
        nom: company.name ?? entreprise.nom,
        adresse: company.address ?? entreprise.adresse,
        cnps: company.cnps_number ?? entreprise.cnps,
        ville: company.city ?? entreprise.ville,
      };
    }
  }

  const data: TemplateData = {
    entreprise,
    employe: {
      nom_complet: emp.full_name,
      matricule: emp.matricule ?? "—",
      poste: emp.poste,
      departement: emp.departement ?? "—",
      date_embauche: emp.date_embauche
        ? new Date(emp.date_embauche).toLocaleDateString("fr-CI", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "—",
      type_contrat: emp.type_contrat ?? "CDI",
      salaire_brut: Number(emp.salaire_brut ?? 0),
      categorie: emp.categorie ?? "—",
      genre: emp.genre ?? "M",
    },
    date_document: new Date().toLocaleDateString("fr-CI", { day: "2-digit", month: "2-digit", year: "numeric" }),
    variables_custom,
  };

  const document = template.generate(data);

  return NextResponse.json({
    document,
    label: template.label,
    employee: emp.full_name,
    template_id,
  });
}
