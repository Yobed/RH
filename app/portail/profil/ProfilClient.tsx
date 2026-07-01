"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Save, Shield, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { PortailHeader } from "../PortailHeader";

interface Employee {
  full_name: string;
  matricule: string;
  email: string | null;
  poste: string | null;
  departement: string | null;
  type_contrat: string | null;
  date_embauche: string;
  num_cnps: string | null;
  phone: string;
  adresse: string;
  situation_logement: string;
  rib: string;
  mobile_money: string;
  contact_urgence_nom: string;
  contact_urgence_tel: string;
}

export function ProfilClient({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [phone, setPhone] = useState(employee.phone);
  const [adresse, setAdresse] = useState(employee.adresse);
  const [situationLogement, setSituationLogement] = useState(employee.situation_logement);
  const [rib, setRib] = useState(employee.rib);
  const [mobileMoney, setMobileMoney] = useState(employee.mobile_money);
  const [contactNom, setContactNom] = useState(employee.contact_urgence_nom);
  const [contactTel, setContactTel] = useState(employee.contact_urgence_tel);
  const [saving, setSaving] = useState(false);

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch("/api/portail/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone || null,
          adresse: adresse || null,
          situation_logement: situationLogement || null,
          rib: rib || null,
          mobile_money: mobileMoney || null,
          contact_urgence_nom: contactNom || null,
          contact_urgence_tel: contactTel || null,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur");
        return;
      }
      toast.success("Profil mis à jour");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PortailHeader
        title="Mon profil"
        subtitle="Vos informations personnelles. Toute modification est tracée et partagée avec votre service RH."
        icon={UserCircle}
      />

      {/* Infos non modifiables */}
      <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Informations RH</h2>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-auto">Modifiable uniquement par le service RH</span>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 p-4 sm:p-5">
          <Info label="Nom" value={employee.full_name} />
          <Info label="Matricule" value={employee.matricule} />
          <Info label="Email pro" value={employee.email ?? "—"} />
          <Info label="Poste" value={employee.poste ?? "—"} />
          <Info label="Département" value={employee.departement ?? "—"} />
          <Info label="Type contrat" value={employee.type_contrat ?? "—"} />
          <Info
            label="Date d'embauche"
            value={employee.date_embauche ? new Date(employee.date_embauche).toLocaleDateString("fr-CI") : "—"}
          />
          <Info label="N° CNPS" value={employee.num_cnps ?? "—"} />
        </dl>
      </section>

      {/* Champs modifiables */}
      <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mes coordonnées</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tenez ces informations à jour pour la paie et les communications.</p>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Téléphone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 07 00 00 00"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700"
            />
          </Field>
          <Field label="Situation logement">
            <select
              value={situationLogement}
              onChange={(e) => setSituationLogement(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">— Choisir —</option>
              <option value="Locataire">Locataire</option>
              <option value="Propriétaire">Propriétaire</option>
              <option value="Hébergé(e)">Hébergé(e)</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Adresse domicile">
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Quartier, commune, ville"
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </Field>
          </div>
          <Field label="RIB / IBAN">
            <input
              type="text"
              value={rib}
              onChange={(e) => setRib(e.target.value)}
              placeholder="CI00 XXXX XXXX XXXX XXXX"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm tabular-nums dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </Field>
          <Field label="Mobile Money">
            <input
              type="text"
              value={mobileMoney}
              onChange={(e) => setMobileMoney(e.target.value)}
              placeholder="Orange Money / Wave / MTN"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Contact d'urgence</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Personne à prévenir en cas de besoin.</p>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nom et prénoms">
            <input
              type="text"
              value={contactNom}
              onChange={(e) => setContactNom(e.target.value)}
              placeholder="Ex : KOFFI Aminata (épouse)"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </Field>
          <Field label="Téléphone">
            <input
              type="tel"
              value={contactTel}
              onChange={(e) => setContactTel(e.target.value)}
              placeholder="+225 05 00 00 00"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </Field>
        </div>
      </section>

      {/* Avis confidentialité */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5 flex gap-2.5 dark:border-slate-800 dark:bg-slate-900/50">
        <Shield className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Vos données sont traitées conformément à la
          <a href="/legal/confidentialite" target="_blank" className="text-slate-900 dark:text-slate-100 underline ml-1">politique de confidentialité</a>
          {" "}(Loi n° 2013-450 ARTCI).
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Enregistrement…" : "Enregistrer mes modifications"}
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5 truncate">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">{label}</label>
      {children}
    </div>
  );
}
