import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/portail/attestation
 * Generates a salary attestation PDF data for the authenticated employee.
 * The employee can then download it directly from the portal.
 */
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get profile to find employee_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("employee_id, role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.employee_id || profile.role !== "salarie") {
      return NextResponse.json(
        { error: "Accès réservé aux salariés" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const type = (body as { type?: string }).type ?? "salaire";

    // Fetch employee data
    const { data: emp } = await supabase
      .from("employees")
      .select(
        "full_name, matricule, poste, departement, date_embauche, salaire_brut, type_contrat, company_id"
      )
      .eq("id", profile.employee_id)
      .single();

    if (!emp) {
      return NextResponse.json(
        { error: "Employé introuvable" },
        { status: 404 }
      );
    }

    // Fetch company info
    const { data: company } = await supabase
      .from("companies")
      .select("name, address, phone, email, registration_number")
      .eq("id", emp.company_id)
      .single();

    // Fetch latest bulletin for salary attestation
    let latestBulletin = null;
    if (type === "salaire") {
      const { data } = await supabase
        .from("bulletins_paie")
        .select("periode, salaire_brut, salaire_net, net_to_pay")
        .eq("employee_id", profile.employee_id)
        .order("periode", { ascending: false })
        .limit(1)
        .maybeSingle();
      latestBulletin = data;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString("fr-CI", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const fmtXOF = (n: number) =>
      new Intl.NumberFormat("fr-CI", {
        style: "currency",
        currency: "XOF",
        minimumFractionDigits: 0,
      }).format(n);

    // Build attestation content
    const attestation = {
      type,
      generated_at: now.toISOString(),
      company: {
        name: company?.name ?? "—",
        address: company?.address ?? "—",
        phone: company?.phone ?? "—",
        email: company?.email ?? "—",
        registration_number: company?.registration_number ?? "—",
      },
      employee: {
        full_name: emp.full_name,
        matricule: emp.matricule,
        poste: emp.poste,
        departement: emp.departement,
        date_embauche: emp.date_embauche,
        type_contrat: emp.type_contrat,
      },
      content:
        type === "salaire"
          ? {
              title: "ATTESTATION DE SALAIRE",
              body: `Je soussigné(e), ${company?.name ?? "l'entreprise"}, certifie que ${emp.full_name}, matricule ${emp.matricule}, occupe le poste de ${emp.poste ?? "—"} au sein de notre entreprise depuis le ${emp.date_embauche ? new Date(emp.date_embauche).toLocaleDateString("fr-CI") : "—"}.

Son salaire mensuel brut s'élève à ${fmtXOF(emp.salaire_brut ?? 0)}.${latestBulletin ? `\nSon dernier salaire net perçu (${latestBulletin.periode}) est de ${fmtXOF(Number(latestBulletin.net_to_pay ?? latestBulletin.salaire_net ?? 0))}.` : ""}

Cette attestation est délivrée pour servir et valoir ce que de droit.`,
              date: dateFormatted,
            }
          : {
              title: "ATTESTATION DE TRAVAIL",
              body: `Je soussigné(e), ${company?.name ?? "l'entreprise"}, certifie que ${emp.full_name}, matricule ${emp.matricule}, est employé(e) au sein de notre entreprise en qualité de ${emp.poste ?? "—"} depuis le ${emp.date_embauche ? new Date(emp.date_embauche).toLocaleDateString("fr-CI") : "—"}.

Type de contrat : ${emp.type_contrat ?? "—"}.
Département : ${emp.departement ?? "—"}.

Cette attestation est délivrée pour servir et valoir ce que de droit.`,
              date: dateFormatted,
            },
    };

    // Log the attestation generation for audit
    await logAuditEvent({
      action: "generate",
      entity_type: "attestation",
      entity_id: profile.employee_id,
      details: { type, employee_name: emp.full_name },
    });

    return NextResponse.json(attestation);
  } catch (error) {
    console.error("[ATTESTATION] Error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
