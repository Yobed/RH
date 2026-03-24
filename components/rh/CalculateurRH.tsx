"use client";

import { useState } from "react";

const fcfa = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(Math.round(n));

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// ── Indemnité de licenciement ──────────────────────────────────────────
// Art. 74 CT-CI — paliers d'ancienneté : 30% (1-5 ans), 35% (6-10 ans), 40% (11+)
function calculerIndemniteLicenciement(salaire: number, annees: number): number {
  let indemnite = 0;
  for (let a = 1; a <= annees; a++) {
    const taux = a <= 5 ? 0.30 : a <= 10 ? 0.35 : 0.40;
    indemnite += salaire * taux;
  }
  // Fraction d'année pour les mois résiduels (arrondi à l'entier)
  const fractionAnnee = annees - Math.floor(annees);
  if (fractionAnnee > 0) {
    const anneeComplete = Math.floor(annees);
    const taux = anneeComplete < 5 ? 0.30 : anneeComplete < 10 ? 0.35 : 0.40;
    indemnite += salaire * taux * fractionAnnee;
  }
  return Math.round(indemnite);
}

function CalcLicenciement() {
  const [salaire, setSalaire] = useState("");
  const [annees, setAnnees] = useState("");

  const sal = Number(salaire);
  const ann = Number(annees);
  const result = salaire && annees && sal > 0 && ann > 0
    ? calculerIndemniteLicenciement(sal, ann)
    : null;

  const detail = annees && Number(annees) > 0 ? [
    { tranche: "1–5 ans", taux: "30%" },
    ...(ann > 5 ? [{ tranche: "6–10 ans", taux: "35%" }] : []),
    ...(ann > 10 ? [{ tranche: "11 ans et +", taux: "40%" }] : []),
  ] : [];

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Indemnité de licenciement</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Art. 74 Code du Travail CI — Paliers : 30% (1–5 ans) · 35% (6–10 ans) · 40% (11 ans et +)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Salaire brut mensuel (FCFA)</label>
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
                <span>{d.taux} du salaire mensuel brut / an</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-emerald-600">Hors congés payés non pris — Licenciement non fautif uniquement</p>
        </div>
      )}
    </div>
  );
}

// ── Préavis CDI ────────────────────────────────────────────────────────
function CalcPreavis() {
  const [categorie, setCategorie] = useState<"ouvrier" | "agent_maitrise" | "cadre">("ouvrier");
  const [salaire, setSalaire] = useState("");

  const durees = {
    ouvrier: { label: "Ouvrier / Employé", mois: 1 },
    agent_maitrise: { label: "Agent de maîtrise", mois: 2 },
    cadre: { label: "Cadre / Assimilé cadre", mois: 3 },
  };

  const duree = durees[categorie];
  const montant = salaire ? Number(salaire) * duree.mois : null;

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Préavis CDI (licenciement)</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Art. 16 Code du Travail CI
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Catégorie</label>
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

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-blue-700">Durée du préavis</span>
          <span className="font-bold text-blue-800">{duree.mois} mois</span>
        </div>
        {montant !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Salaire dû pendant le préavis</span>
            <span className="font-bold text-blue-800">{fcfa(montant)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Congés payés ───────────────────────────────────────────────────────
function CalcConges() {
  const [moisTravailles, setMoisTravailles] = useState("");
  const [salaire, setSalaire] = useState("");

  // Art. 25 CT CI : 2,2 jours ouvrables/mois = 26,4 jours/an
  const joursAcquis = moisTravailles ? Number(moisTravailles) * 2.2 : null;
  const indemnite =
    salaire && moisTravailles
      ? (Number(salaire) / 26) * (Number(moisTravailles) * 2.2)
      : null;

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Congés payés</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Art. 25 Code du Travail CI — 2,2 jours ouvrables / mois de service effectif
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Mois de service effectif</label>
          <input
            type="number"
            min="0"
            max="12"
            step="1"
            value={moisTravailles}
            onChange={(e) => setMoisTravailles(e.target.value)}
            placeholder="12"
            className={`mt-1 ${selectClass}`}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Salaire journalier brut (FCFA)</label>
          <input
            type="number"
            min="0"
            step="500"
            value={salaire}
            onChange={(e) => setSalaire(e.target.value)}
            placeholder="6 500"
            className={`mt-1 ${selectClass}`}
          />
          <p className="mt-1 text-xs text-muted-foreground">Salaire mensuel ÷ 26 jours ouvrables</p>
        </div>
      </div>

      {joursAcquis !== null && (
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-purple-700">Jours de congé acquis</span>
            <span className="font-bold text-purple-800">{joursAcquis.toFixed(1)} jours</span>
          </div>
          {indemnite !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-purple-700">Indemnité compensatrice</span>
              <span className="font-bold text-purple-800">{fcfa(indemnite)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Heures supplémentaires ─────────────────────────────────────────────
function CalcHeureSup() {
  const [tauxHoraire, setTauxHoraire] = useState("");
  const [heures, setHeures] = useState("");
  const [type, setType] = useState<"jour_semaine" | "samedi" | "dimanche_ferie">("jour_semaine");

  const majorations = {
    jour_semaine: { label: "Jour de semaine (41e–48e h)", taux: 0.15 },
    samedi: { label: "Samedi (après 40h)", taux: 0.35 },
    dimanche_ferie: { label: "Dimanche / Jour férié", taux: 0.50 },
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
          Décret n°96-287 CI — Majoration de 15% à 50% selon l'horaire
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Taux horaire (FCFA)</label>
          <input
            type="number"
            min="0"
            step="100"
            value={tauxHoraire}
            onChange={(e) => setTauxHoraire(e.target.value)}
            placeholder="865"
            className={`mt-1 ${selectClass}`}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Nombre d'heures sup.</label>
          <input
            type="number"
            min="0"
            max="200"
            step="0.5"
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
              <option key={k} value={k}>{v.label}</option>
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
            <span className="text-amber-700">Montant total des heures sup.</span>
            <span className="font-bold text-amber-800">{fcfa(montant)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────
export function CalculateurRH() {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-xs text-blue-800">
        Ces calculs sont indicatifs. Ils se basent sur le Code du Travail CI (Loi 2015-532) et le Décret
        n°96-287 du 3 avril 1996. Consultez un juriste pour les cas complexes.
      </div>
      <CalcLicenciement />
      <CalcPreavis />
      <CalcConges />
      <CalcHeureSup />
    </div>
  );
}
