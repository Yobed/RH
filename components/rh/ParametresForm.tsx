"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ConventionType =
  | "CCI"
  | "Commerce"
  | "BTP"
  | "Banque & Assurance"
  | "Transport"
  | "Industrie"
  | "Agriculture";

interface Props {
  profile: { full_name: string; email: string; role: string };
  company: {
    name: string;
    convention_collective: string;
    raison_sociale?: string | null;
    adresse?: string | null;
    cnps_matricule?: string | null;
    nccm?: string | null;
    ncc?: string | null;
    taux_at_mp?: number | null;
    adresse_paie?: string | null;
    contact_paie?: string | null;
    code_naf?: string | null;
  };
  fiscalParams: {
    convention: ConventionType;
    valeur_point: number;
  };
}

const CONVENTIONS_GENERALES = [
  "",
  "Convention Collective Interprofessionnelle",
  "Convention Collective Commerce",
  "Convention Collective BTP",
  "Convention Collective Banque & Assurance",
  "Convention Collective Transport",
  "Convention Collective Industrie",
  "Convention Collective Agriculture",
];

const CONVENTIONS_CALCUL: { value: ConventionType; label: string }[] = [
  { value: "CCI", label: "Interprofessionnelle (CCI)" },
  { value: "Commerce", label: "Commerce" },
  { value: "BTP", label: "Bâtiment & Travaux Publics (BTP)" },
  { value: "Banque & Assurance", label: "Banque & Assurance" },
  { value: "Transport", label: "Transport" },
  { value: "Industrie", label: "Industrie" },
  { value: "Agriculture", label: "Agriculture" },
];

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function ParametresForm({ profile, company, fiscalParams }: Props) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [companyName, setCompanyName] = useState(company.name);
  const [convention, setConvention] = useState(company.convention_collective);
  const [raisonSociale, setRaisonSociale] = useState(company.raison_sociale ?? "");
  const [adresse, setAdresse] = useState(company.adresse ?? "");
  const [cnpsMatricule, setCnpsMatricule] = useState(company.cnps_matricule ?? "");
  const [nccm, setNccm] = useState(company.nccm ?? "");
  const [ncc, setNcc] = useState(company.ncc ?? "");
  // Conformité audit — paie & sécurité sociale
  const [tauxAtMp, setTauxAtMp] = useState<string>(
    company.taux_at_mp != null ? String(company.taux_at_mp * 100) : "3"
  );
  const [adressePaie, setAdressePaie] = useState(company.adresse_paie ?? "");
  const [contactPaie, setContactPaie] = useState(company.contact_paie ?? "");
  const [codeNaf, setCodeNaf] = useState(company.code_naf ?? "");
  const [savingProfil, setSavingProfil] = useState(false);
  const [savingEntreprise, setSavingEntreprise] = useState(false);

  // Paramètres fiscaux (convention collective de calcul)
  const [conventionCalcul, setConventionCalcul] = useState<ConventionType>(
    fiscalParams.convention
  );
  const [valeurPoint, setValeurPoint] = useState<string>(
    fiscalParams.valeur_point.toString()
  );
  const [savingFiscal, setSavingFiscal] = useState(false);

  async function saveProfil() {
    if (!fullName.trim()) return;
    setSavingProfil(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur serveur");
        return;
      }
      toast.success("Profil mis à jour");
    } finally {
      setSavingProfil(false);
    }
  }

  async function saveEntreprise() {
    if (!companyName.trim()) return;
    const tauxNum = parseFloat(tauxAtMp);
    if (isNaN(tauxNum) || tauxNum < 2 || tauxNum > 10) {
      toast.error("Taux AT/MP invalide — doit être entre 2 et 10 %.");
      return;
    }
    setSavingEntreprise(true);
    try {
      const res = await fetch("/api/entreprise", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          convention_collective: convention || null,
          raison_sociale: raisonSociale || null,
          adresse: adresse || null,
          cnps_matricule: cnpsMatricule || null,
          nccm: nccm || null,
          ncc: ncc || null,
          taux_at_mp: tauxNum / 100,
          adresse_paie: adressePaie || null,
          contact_paie: contactPaie || null,
          code_naf: codeNaf || null,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur serveur");
        return;
      }
      toast.success("Entreprise mise à jour");
    } finally {
      setSavingEntreprise(false);
    }
  }

  async function saveFiscalParams() {
    const point = parseFloat(valeurPoint);
    if (isNaN(point) || point < 0) {
      toast.error("Valeur de point invalide");
      return;
    }
    setSavingFiscal(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convention: conventionCalcul,
          valeur_point: point,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur serveur");
        return;
      }
      toast.success("Paramètres de calcul sauvegardés");
    } finally {
      setSavingFiscal(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profil utilisateur */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold">Profil utilisateur</h2>

        <div>
          <label className="text-sm font-medium">Nom complet</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Votre nom"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Adresse email</label>
          <Input value={profile.email} disabled className="mt-1 bg-muted/30" />
          <p className="mt-1 text-xs text-muted-foreground">
            L'email ne peut pas être modifié ici.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Rôle</label>
          <Input value={profile.role} disabled className="mt-1 bg-muted/30 capitalize" />
        </div>

        <Button onClick={saveProfil} disabled={savingProfil || !fullName.trim()}>
          {savingProfil ? "Enregistrement..." : "Sauvegarder le profil"}
        </Button>
      </div>

      {/* Entreprise */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold">Entreprise</h2>

        <div>
          <label className="text-sm font-medium">Raison sociale *</label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Nom de l'entreprise"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Convention collective applicable</label>
          <select
            value={convention}
            onChange={(e) => setConvention(e.target.value)}
            className={`mt-1 ${selectClass}`}
          >
            {CONVENTIONS_GENERALES.map((c) => (
              <option key={c} value={c}>
                {c || "— Aucune convention spécifique —"}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Détermine les règles applicables dans le module Contentieux et l'Agent Juridique.
          </p>
        </div>

        {/* Informations légales pour le bulletin de paie */}
        <div className="border-t pt-4 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Informations légales (bulletin de paie)
          </h3>

          <div>
            <label className="text-sm font-medium">Raison sociale</label>
            <Input
              value={raisonSociale}
              onChange={(e) => setRaisonSociale(e.target.value)}
              placeholder="ex: SARL GRAVEL IVOIRE"
              className="mt-1"
              maxLength={200}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Dénomination légale affichée sur le bulletin de paie.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Adresse du siège</label>
            <Input
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="ex: Abidjan, Plateau, Rue des Jardins"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Matricule CNPS employeur</label>
            <Input
              value={cnpsMatricule}
              onChange={(e) => setCnpsMatricule(e.target.value)}
              placeholder="ex: 123456789"
              className="mt-1"
              maxLength={30}
            />
          </div>

          <div>
            <label className="text-sm font-medium">N° Compte Cotisant Maladie</label>
            <Input
              value={nccm}
              onChange={(e) => setNccm(e.target.value)}
              placeholder="ex: 0012345"
              className="mt-1"
              maxLength={30}
            />
          </div>

          <div>
            <label className="text-sm font-medium">N° Compte Contribuable</label>
            <Input
              value={ncc}
              onChange={(e) => setNcc(e.target.value)}
              placeholder="ex: CI-ABJ-2025-000123"
              className="mt-1"
              maxLength={30}
            />
          </div>
        </div>

        {/* Paie & sécurité sociale — conformité Arrêté 2008-2401 */}
        <div className="border-t pt-4 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Paie & sécurité sociale
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Taux AT/MP (%)</label>
              <Input
                type="number"
                step="0.01"
                min="2"
                max="10"
                value={tauxAtMp}
                onChange={(e) => setTauxAtMp(e.target.value)}
                placeholder="ex: 3"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Accidents du travail / Maladies professionnelles. Variable selon
                le secteur (2–5 % en général). Valeur exacte fournie par la CNPS.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Code NAF / secteur</label>
              <Input
                value={codeNaf}
                onChange={(e) => setCodeNaf(e.target.value)}
                placeholder="ex: 6201Z"
                className="mt-1"
                maxLength={20}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Détermine la grille AT/MP applicable.
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Adresse du service paie</label>
            <Input
              value={adressePaie}
              onChange={(e) => setAdressePaie(e.target.value)}
              placeholder="ex: Direction des Ressources Humaines, Plateau, Abidjan"
              className="mt-1"
              maxLength={255}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Mention obligatoire sur le bulletin de paie (Arrêté n° 2008-2401).
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Contact service paie</label>
            <Input
              value={contactPaie}
              onChange={(e) => setContactPaie(e.target.value)}
              placeholder="ex: paie@entreprise.ci · +225 27 21 00 00 00"
              className="mt-1"
              maxLength={150}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Coordonnées affichées sur le bulletin pour réclamations.
            </p>
          </div>
        </div>

        <Button
          onClick={saveEntreprise}
          disabled={savingEntreprise || !companyName.trim()}
        >
          {savingEntreprise ? "Enregistrement..." : "Sauvegarder l'entreprise"}
        </Button>
      </div>

      {/* Paramètres de calcul — Convention collective */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Paramètres de calcul salarial</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure les règles de calcul propres à votre convention collective (primes
            d'ancienneté, sursalaires, valeur du point).
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Convention collective de calcul</label>
          <select
            value={conventionCalcul}
            onChange={(e) => setConventionCalcul(e.target.value as ConventionType)}
            className={`mt-1 ${selectClass}`}
          >
            {CONVENTIONS_CALCUL.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Sélectionnez la convention qui régit le calcul des primes et indemnités dans votre
            secteur d'activité.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Valeur du point (FCFA)</label>
          <Input
            type="number"
            min={0}
            step={1}
            value={valeurPoint}
            onChange={(e) => setValeurPoint(e.target.value)}
            placeholder="ex: 450"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Utilisée pour le calcul du sursalaire et des primes conventionnelles. Saisir 0 si non
            applicable.
          </p>
        </div>

        <Button onClick={saveFiscalParams} disabled={savingFiscal}>
          {savingFiscal ? "Enregistrement..." : "Sauvegarder les paramètres de calcul"}
        </Button>
      </div>

      {/* Droit applicable */}
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Droit applicable</p>
        <p>
          Code du Travail ivoirien — Loi n°2015-532 du 20 juillet 2015 · Décret n°96-287 du 3
          avril 1996
        </p>
        <p className="mt-1 text-xs text-blue-600">
          SMIG en vigueur : 75 000 FCFA/mois (Décret n°2023-374)
        </p>
      </div>
    </div>
  );
}
