"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  profile: { full_name: string; email: string; role: string };
  company: { name: string; convention_collective: string };
}

const CONVENTIONS = [
  "",
  "Convention Collective Interprofessionnelle",
  "Convention Collective Commerce",
  "Convention Collective BTP",
  "Convention Collective Banque & Assurance",
  "Convention Collective Transport",
  "Convention Collective Industrie",
  "Convention Collective Agriculture",
];

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function ParametresForm({ profile, company }: Props) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [companyName, setCompanyName] = useState(company.name);
  const [convention, setConvention] = useState(company.convention_collective);
  const [savingProfil, setSavingProfil] = useState(false);
  const [savingEntreprise, setSavingEntreprise] = useState(false);

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
    setSavingEntreprise(true);
    try {
      const res = await fetch("/api/entreprise", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          convention_collective: convention || null,
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
            {CONVENTIONS.map((c) => (
              <option key={c} value={c}>
                {c || "— Aucune convention spécifique —"}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Détermine les règles applicables dans le module Contentieux et l'Agent Juridique.
          </p>
        </div>

        <Button
          onClick={saveEntreprise}
          disabled={savingEntreprise || !companyName.trim()}
        >
          {savingEntreprise ? "Enregistrement..." : "Sauvegarder l'entreprise"}
        </Button>
      </div>

      {/* Informations légales */}
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Droit applicable</p>
        <p>
          Code du Travail ivoirien — Loi n°2015-532 du 20 juillet 2015 · Décret n°96-287 du 3 avril 1996
        </p>
        <p className="mt-1 text-xs text-blue-600">
          SMIG en vigueur : 75 000 FCFA/mois (Décret n°2023-374)
        </p>
      </div>
    </div>
  );
}
