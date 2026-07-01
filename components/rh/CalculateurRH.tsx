"use client";

import { useState } from "react";
import {
  SMIG_MENSUEL,
  calculerIndemniteLicenciement,
  MAJORATIONS_HEURES_SUP,
  CONGES_FAMILIAUX,
} from "@/lib/paie-ci";

const fcfa = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(Math.round(n));

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// ── Indemnité de licenciement ──────────────────────────────────────────
// Source : Décret n°96-201 du 7 mars 1996 / CCI Art. 39
// Base : salaire global mensuel moyen des 12 derniers mois
function CalcLicenciement() {
  const [salaire, setSalaire] = useState("");
  const [annees, setAnnees] = useState("");

  const sal = Number(salaire);
  const ann = Number(annees);
  const result = salaire && annees && sal > 0 && ann > 0
    ? calculerIndemniteLicenciement(sal, ann)
    : null;

  const detail = ann > 0 ? [
    { tranche: "1–5 ans", taux: "30%", applicable: true },
    { tranche: "6–10 ans", taux: "35%", applicable: ann > 5 },
    { tranche: "11 ans et +", taux: "40%", applicable: ann > 10 },
  ].filter((d) => d.applicable) : [];

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Indemnité de licenciement</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Décret n°96-201 / CCI Art. 39 — Paliers : 30% (1–5 ans) · 35% (6–10 ans) · 40% (11 ans et +)
        </p>
      </div>

      <div className="rounded bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
        La base de calcul est le <strong>salaire global mensuel moyen des 12 derniers mois</strong>, non le salaire brut actuel.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Salaire moyen 12 mois (FCFA)</label>
          <input
            type="number"
            min="0"
            step="1000"
            value={salaire}
            onChange={(e) => setSalaire(e.target.value)}
            placeholder="150 000"
            className={`mt-1 ${selectClass}`}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Ancienneté (années)</label>
          <input
            type="number"
            min="0"
            max="50"
            step="0.5"
            value={annees}
            onChange={(e) => setAnnees(e.target.value)}
            placeholder="5"
            className={`mt-1 ${selectClass}`}
          />
        </div>
      </div>

      {result !== null && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-emerald-700 font-medium">Indemnité estimée</span>
            <span className="text-2xl font-bold text-emerald-800">{fcfa(result)}</span>
          </div>
          <div className="border-t border-emerald-200 pt-2 space-y-1">
            {detail.map((d) => (
              <div key={d.tranche} className="flex justify-between text-xs text-emerald-700">
                <span>{d.tranche}</span>
                <span>{d.taux} du salaire moyen mensuel / an</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-emerald-600">Licenciement non fautif uniquement — Hors congés payés non pris</p>
        </div>
      )}
    </div>
  );
}

// ── Préavis CDI ────────────────────────────────────────────────────────
// Source : Décret n°96-200 du 7 mars 1996 / CCI Art. 34
function CalcPreavis() {
  const [categorie, setCategorie] = useState<"ouvrier" | "agent_maitrise" | "cadre">("ouvrier");
  const [salaire, setSalaire] = useState("");

  const durees = {
    ouvrier: {
      label: "Ouvrier / Employé (cat. 1–5)",
      description: "8 jours min. — 4 mois max.",
      moisMin: 8 / 30,
      moisMax: 4,
    },
    agent_maitrise: {
      label: "Agent de maîtrise (cat. 6+)",
      description: "3 mois min. — 4 mois max.",
      moisMin: 3,
      moisMax: 4,
    },
    cadre: {
      label: "Cadre / Assimilé cadre",
      description: "3 mois min. — 4 mois max.",
      moisMin: 3,
      moisMax: 4,
    },
  };

  const duree = durees[categorie];
  const montantMin = salaire ? Number(salaire) * duree.moisMin : null;
  const montantMax = salaire ? Number(salaire) * duree.moisMax : null;

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Préavis CDI (licenciement / démission)</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Décret n°96-200 / CCI Art. 34
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Catégorie professionnelle</label>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value as typeof categorie)}
            className={`mt-1 ${selectClass}`}
          >
            {Object.entries(durees).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Salaire brut mensuel (FCFA)</label>
          <input
            type="number"
            min="0"
            step="1000"
            value={salaire}
            onChange={(e) => setSalaire(e.target.value)}
            placeholder="200 000"
            className={`mt-1 ${selectClass}`}
          />
        </div>
      </div>

      <div className="rounded-lg bg-[#ee7f03]/10 border border-[#ee7f03]/30 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#ee7f03]">Durée du préavis</span>
          <span className="font-bold text-[#d67002]">{duree.description}</span>
        </div>
        {montantMin !== null && montantMax !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-[#ee7f03]">Indemnité compensatrice</span>
            <span className="font-bold text-[#d67002]">
              {fcfa(montantMin)} — {fcfa(montantMax)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Congés payés ───────────────────────────────────────────────────────
// Source : Ordonnance n°2021-902 (Art. 25.2 CT-CI) / CCI Art. 69
function CalcConges() {
  const [moisTravailles, setMoisTravailles] = useState("");
  const [salaire, setSalaire] = useState("");
  const [anciennete, setAnciennete] = useState("0");

  // Majoration ancienneté : +1j/5 ans, +2j/10 ans, +3j/15 ans, +5j/20 ans, +7j/25 ans, +8j/30 ans
  const majorationsAnciennete = [
    { annees: 30, jours: 8 }, { annees: 25, jours: 7 }, { annees: 20, jours: 5 },
    { annees: 15, jours: 3 }, { annees: 10, jours: 2 }, { annees: 5, jours: 1 },
  ];
  const ann = Number(anciennete);
  const majorationAnnuelle = majorationsAnciennete.find((m) => ann >= m.annees)?.jours ?? 0;

  const joursBase = moisTravailles ? Number(moisTravailles) * 2.2 : null;
  const joursTotal = joursBase !== null ? joursBase + majorationAnnuelle : null;
  const indemnite =
    salaire && joursTotal !== null
      ? (Number(salaire) / 26) * joursTotal
      : null;

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Congés payés</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Conventionnelle / Entreprise — 2,2 jours ouvrables / mois de service effectif
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Mois de service effectif</label>
          <input
            type="number" min="0" max="12" step="1"
            value={moisTravailles}
            onChange={(e) => setMoisTravailles(e.target.value)}
            placeholder="12"
            className={`mt-1 ${selectClass}`}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Ancienneté (années)</label>
          <input
            type="number" min="0" max="50" step="1"
            value={anciennete}
            onChange={(e) => setAnciennete(e.target.value)}
            placeholder="0"
            className={`mt-1 ${selectClass}`}
          />
          {majorationAnnuelle > 0 && (
            <p className="mt-1 text-xs text-primary">+{majorationAnnuelle} jour(s) ancienneté</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Salaire journalier brut (FCFA)</label>
          <input
            type="number" min="0" step="500"
            value={salaire}
            onChange={(e) => setSalaire(e.target.value)}
            placeholder="6 500"
            className={`mt-1 ${selectClass}`}
          />
          <p className="mt-1 text-xs text-muted-foreground">Salaire mensuel ÷ 26 jours ouvrables</p>
        </div>
      </div>

      {joursTotal !== null && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-700">Jours de base (2,2 × mois)</span>
            <span className="font-bold text-slate-800">{joursBase?.toFixed(1)} jours</span>
          </div>
          {majorationAnnuelle > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-700">Majoration ancienneté</span>
              <span className="font-bold text-slate-800">+{majorationAnnuelle} jours</span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
            <span className="text-slate-700 font-medium">Total congés acquis</span>
            <span className="font-bold text-slate-800">{joursTotal.toFixed(1)} jours</span>
          </div>
          {indemnite !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-700">Indemnité compensatrice</span>
              <span className="font-bold text-slate-800">{fcfa(indemnite)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Heures supplémentaires ─────────────────────────────────────────────
// Source : Décret n°96-203 du 7 mars 1996
function CalcHeureSup() {
  const [tauxHoraire, setTauxHoraire] = useState("");
  const [heures, setHeures] = useState("");
  const [type, setType] = useState<keyof typeof majorations>("semaine_41_46");

  const majorations = {
    semaine_41_46: {
      label: "Semaine — 41e à 46e heure",
      taux: MAJORATIONS_HEURES_SUP.semaine_41_46,
    },
    semaine_au_dela_46: {
      label: "Semaine — au-delà de la 46e heure",
      taux: MAJORATIONS_HEURES_SUP.semaine_au_dela_46,
    },
    dimanche: {
      label: "Dimanche",
      taux: MAJORATIONS_HEURES_SUP.dimanche,
    },
    jour_ferie: {
      label: "Jour férié",
      taux: MAJORATIONS_HEURES_SUP.jour_ferie,
    },
    nuit: {
      label: "Nuit (21h–5h)",
      taux: MAJORATIONS_HEURES_SUP.nuit,
    },
  };

  const maj = majorations[type];
  const montant =
    tauxHoraire && heures
      ? Number(tauxHoraire) * Number(heures) * (1 + maj.taux)
      : null;

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Heures supplémentaires</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Décret n°96-203 — 15% (41e–46e h) · 50% (au-delà 46e h) · 75% (nuit, dimanche, férié)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Taux horaire normal (FCFA)</label>
          <input
            type="number" min="0" step="100"
            value={tauxHoraire}
            onChange={(e) => setTauxHoraire(e.target.value)}
            placeholder="865"
            className={`mt-1 ${selectClass}`}
          />
          <p className="mt-1 text-xs text-muted-foreground">Salaire mensuel ÷ 173,33 h</p>
        </div>
        <div>
          <label className="text-sm font-medium">Nombre d'heures</label>
          <input
            type="number" min="0" max="200" step="0.5"
            value={heures}
            onChange={(e) => setHeures(e.target.value)}
            placeholder="8"
            className={`mt-1 ${selectClass}`}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className={`mt-1 ${selectClass}`}
          >
            {Object.entries(majorations).map(([k, v]) => (
              <option key={k} value={k}>{v.label} (+{(v.taux * 100).toFixed(0)}%)</option>
            ))}
          </select>
        </div>
      </div>

      {montant !== null && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-amber-700">Majoration appliquée</span>
            <span className="font-bold text-amber-800">+{(maj.taux * 100).toFixed(0)} %</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-amber-700">Montant brut des heures sup.</span>
            <span className="font-bold text-amber-800">{fcfa(montant)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Congés événements familiaux ────────────────────────────────────────
function CalcCongesFamiliaux() {
  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Congés pour événements familiaux</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ordonnance n°2021-902 / CCI Art. 69 — Limite : 10 jours ouvrables par an
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Événement</th>
              <th className="px-4 py-2 text-center font-medium text-muted-foreground w-24">Jours</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {CONGES_FAMILIAUX.map((c) => (
              <tr key={c.type} className="hover:bg-muted/20">
                <td className="px-4 py-2">{c.type}</td>
                <td className="px-4 py-2 text-center font-bold">{c.jours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        SMIG en vigueur : {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(SMIG_MENSUEL)} / mois
        (Décret n°2022-986 du 01/01/2023)
      </p>
    </div>
  );
}

function CalcSoldeDeCompte() {
  const [type, setType] = useState<"CDD" | "CDI">("CDI");
  const [salaireMoyen, setSalaireMoyen] = useState("");
  const [anciennete, setAnciennete] = useState("");
  const [conges, setConges] = useState("");
  const [preavis, setPreavis] = useState("");
  const [sommeBruteCDD, setSommeBruteCDD] = useState("");

  const results = salaireMoyen && anciennete ? {
    indemniteLicenciement: type === "CDI" ? calculerIndemniteLicenciement(Number(salaireMoyen), Number(anciennete)) : 0,
    indemnitePrecarite: type === "CDD" ? Math.round(Number(sommeBruteCDD || 0) * 0.03) : 0,
    conges: Math.round((Number(salaireMoyen) / 26) * Number(conges || 0)),
    preavis: Math.round((Number(salaireMoyen) / 26) * Number(preavis || 0)),
  } : null;

  const total = results ? results.indemniteLicenciement + results.indemnitePrecarite + results.conges + results.preavis : 0;

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Solde de Tout Compte (STC)</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Estimation des indemnités de fin de contrat — Art. 14.8 & 74 CT-CI
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Type de contrat</label>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className={`mt-1 ${selectClass}`}>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Salaire moyen mensuel (FCFA)</label>
          <input type="number" value={salaireMoyen} onChange={(e) => setSalaireMoyen(e.target.value)} placeholder="200 000" className={`mt-1 ${selectClass}`} />
        </div>
        {type === "CDD" && (
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Somme totale des salaires bruts perçus (FCFA)</label>
            <input type="number" value={sommeBruteCDD} onChange={(e) => setSommeBruteCDD(e.target.value)} placeholder="1 200 000" className={`mt-1 ${selectClass}`} />
            <p className="text-[10px] text-muted-foreground mt-1">L'indemnité de précarité (3%) est calculée sur ce montant total.</p>
          </div>
        )}
        <div>
          <label className="text-sm font-medium">Ancienneté (années)</label>
          <input type="number" step="0.1" value={anciennete} onChange={(e) => setAnciennete(e.target.value)} placeholder="2.5" className={`mt-1 ${selectClass}`} />
        </div>
        <div>
          <label className="text-sm font-medium">Reliquat congés (jours)</label>
          <input type="number" value={conges} onChange={(e) => setConges(e.target.value)} placeholder="15" className={`mt-1 ${selectClass}`} />
        </div>
      </div>

      {results && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
          {type === "CDI" && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Indemnité de licenciement</span>
              <span className="font-medium">{fcfa(results.indemniteLicenciement)}</span>
            </div>
          )}
          {type === "CDD" && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Indemnité de précarité (3%)</span>
              <span className="font-medium">{fcfa(results.indemnitePrecarite)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Indemnité compensatrice de congés</span>
            <span className="font-medium">{fcfa(results.conges)}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2 mt-2">
            <span className="text-slate-800 font-bold text-lg">Total STC Estimé</span>
            <span className="text-slate-900 font-bold text-lg">{fcfa(total)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            * Hors prorata de 13e mois et indemnité de préavis éventuelle. Calcul théorique à valider.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────
export function CalculateurRH() {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-[#ee7f03]/10 border-[#ee7f03]/30 p-3 text-xs text-[#d67002]">
        Calculs basés sur le <strong>Code du Travail CI 2025</strong>, la <strong>Convention Collective Interprofessionnelle AICI-UGTCI</strong>
        et les décrets d&apos;application (Décrets n°96-200, 96-201, 96-203 / Décret n°2022-986).
        Les taux CNPS et barème ITS sont indicatifs — vérifier auprès de la CNPS CI et la Loi de Finances en vigueur.
      </div>
      <CalcLicenciement />
      <CalcPreavis />
      <CalcConges />
      <CalcHeureSup />
      <CalcSoldeDeCompte />
      <CalcCongesFamiliaux />
    </div>
  );
}
