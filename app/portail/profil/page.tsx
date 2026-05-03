import { createServerClient } from "@/lib/supabase/server";
import { requirePortailContext } from "@/lib/portail";
import { ProfilClient } from "./ProfilClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon profil — Portail salarié" };

export default async function MonProfil() {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();

  const { data: emp } = await supabase
    .from("employees")
    .select("full_name, matricule, email, phone, adresse, situation_logement, rib, mobile_money, contact_urgence_nom, contact_urgence_tel, poste, departement, type_contrat, date_embauche, num_cnps")
    .eq("id", ctx.employeeId)
    .single();

  if (!emp) {
    return <p className="text-sm text-slate-500">Profil introuvable.</p>;
  }

  return (
    <ProfilClient
      employee={{
        full_name: emp.full_name,
        matricule: emp.matricule,
        email: emp.email,
        poste: emp.poste,
        departement: emp.departement,
        type_contrat: emp.type_contrat,
        date_embauche: emp.date_embauche,
        num_cnps: emp.num_cnps,
        phone: emp.phone ?? "",
        adresse: emp.adresse ?? "",
        situation_logement: emp.situation_logement ?? "",
        rib: emp.rib ?? "",
        mobile_money: emp.mobile_money ?? "",
        contact_urgence_nom: emp.contact_urgence_nom ?? "",
        contact_urgence_tel: emp.contact_urgence_tel ?? "",
      }}
    />
  );
}
