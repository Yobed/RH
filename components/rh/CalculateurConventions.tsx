"use client";

import { useState } from "react";
import { CONVENTIONS_CI, SMIG_CI, calculerPrimesObligatoires } from "@/lib/conventions-ci";

const CONVENTION_KEYS = Object.keys(CONVENTIONS_CI);

export function CalculateurConventions() {
  const [convention, setConvention] = useState<string>(CONVENTION_KEYS[0] ?? "Commerce");
  const [categorieCode, setCategorieCode] = useState<string>("");
  const [anciennete, setAnciennete] = useState(0);
  const [salaireBase, setSalaireBase] = useState(0);

  const conv = CONVENTIONS_CI[convention];
  const categories = conv?.categories ?? [];
  const selectedCat = categories.find((c) => c.code === categorieCode);

  const salaireCat = selectedCat ? Math.max(selectedCat.salaire_minimum, SMIG_CI) : SMIG_CI;
  const salaireFinal = salaireBase > 0 ? Math.max(salaireBase, salaireCat) : salaireCat;
  const primes = convention && salaireFinal > 0
    ? calculerPrimesObligatoires(convention, salaireFinal, anciennete)
    : [];
  const totalPrimes = primes.reduce((s, p) => s + p.montant, 0);
  const coutTotal = salaireFinal + totalPrimes;

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Convention */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Convention collective</label>
          <select
            value={convention}
            onChange={(e) => { setConvention(e.target.value); setCategorieCode(""); }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {CONVENTION_KEYS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Catégorie */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Catégorie / Échelon</label>
          <select
            value={categorieCode}
            onChange={(e) => setCategorieCode(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">— Sélectionner —</option>
            {categories.map((cat) => (
              <option key={cat.code} value={cat.code}>{cat.code} — {cat.libelle}</option>
            ))}
          </select>
        </div>

        {/* Salaire de base */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Salaire de base (FCFA)</label>
          <input
            type="number"
            value={salaireBase || ""}
            onChange={(e) => setSalaireBase(Number(e.target.value))}
            placeholder={`Min. ${fmt(salaireCat)}`}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Ancienneté */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Ancienneté (années)</label>
          <input
            type="number"
            min={0}
            max={40}
            value={anciennete}
            onChange={(e) => setAnciennete(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Résultats */}
      {(selectedCat || salaireBase > 0) && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <p className="text-sm font-semibold text-foreground">
              Décomposition du coût salarial — {convention}
            </p>
          </div>
          <div className="divide-y divide-border">
            <div className="flex justify-between px-5 py-3 text-sm">
              <span className="text-muted-foreground">Salaire de base</span>
              <span className="font-medium text-foreground">{fmt(salaireFinal)}</span>
            </div>
            {primes.map((prime, i) => (
              <div key={i} className="flex justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">{prime.nom}</span>
                <span className="font-medium text-foreground">{fmt(prime.montant)}</span>
              </div>
            ))}
            <div className="flex justify-between px-5 py-4 text-sm font-bold">
              <span className="text-foreground">Total brut mensuel</span>
              <span className="text-indigo-400 text-base">{fmt(coutTotal)}</span>
            </div>
          </div>

          {selectedCat && (
            <div className="px-5 py-3 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Catégorie {selectedCat.code} — {selectedCat.libelle} · Salaire minimum conventionnel : {fmt(salaireCat)}
                {salaireBase > 0 && salaireBase < salaireCat && (
                  <span className="text-amber-400 ml-2">⚠ Salaire saisi inférieur au minimum conventionnel, ajusté automatiquement.</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        SMIG CI : <strong className="text-foreground">{fmt(SMIG_CI)}</strong> / mois (en vigueur depuis 2023).
        Les primes sont calculées selon les textes conventionnels applicables.
      </div>
    </div>
  );
}
