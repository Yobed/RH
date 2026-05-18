"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  calculerSursalaireDepuisNet,
  type ResultatSursalaireDepuisNet,
} from "@/lib/paie-ci";
import { Calculator, Info, User } from "lucide-react";
import { cn } from "@/lib/utils";

const fcfa = (n: number): string =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(Math.round(n));

const ETATS_CIVILS = [
  "Célibataire",
  "Marié(e)",
  "Divorcé(e)",
  "Veuf/Veuve",
  "Pacsé(e)",
] as const;

interface ResultRow {
  label: string;
  montant: number;
  detail?: string;
  variant?: "deduction" | "addition" | "total" | "neutral";
}

export function CalcSursalaireForm() {
  const [netSouhaite, setNetSouhaite] = useState<string>("350000");
  const [salaireBase, setSalaireBase] = useState<string>("150000");
  const [etatCivil, setEtatCivil] = useState<string>("Célibataire");
  const [nbEnfants, setNbEnfants] = useState<string>("0");
  const [autresRetenues, setAutresRetenues] = useState<string>("0");
  const [avances, setAvances] = useState<string>("0");
  const [computed, setComputed] = useState<ResultatSursalaireDepuisNet | null>(null);

  const handleCalculer = useCallback(() => {
    const result = calculerSursalaireDepuisNet({
      net_souhaite: Number(netSouhaite) || 0,
      salaire_base: Number(salaireBase) || 0,
      etat_civil: etatCivil,
      nb_enfants: Number(nbEnfants) || 0,
      autres_retenues: Number(autresRetenues) || 0,
      avances: Number(avances) || 0,
    });
    setComputed(result);
  }, [netSouhaite, salaireBase, etatCivil, nbEnfants, autresRetenues, avances]);

  const lignes: ResultRow[] = useMemo(() => {
    if (!computed) return [];
    return [
      {
        label: "Salaire catégoriel (base)",
        montant: Number(salaireBase) || 0,
        variant: "neutral",
      },
      ...(computed.prime_anciennete > 0
        ? [{
            label: "Prime d'ancienneté",
            montant: computed.prime_anciennete,
            variant: "addition" as const,
          }]
        : []),
      {
        label: "Sursalaire à fixer",
        montant: computed.sursalaire,
        variant: "total",
        detail: "Montant calculé à ajouter au catégoriel",
      },
      {
        label: "Brut fiscal total",
        montant: computed.brut_fiscal,
        variant: "neutral",
        detail: "Base CNPS et ITS",
      },
      {
        label: "CNPS retraite salarié (6,30%)",
        montant: computed.cnps_retraite,
        variant: "deduction",
        detail: "Plafonné à 3 375 000 FCFA",
      },
      {
        label: "CMU salarié",
        montant: computed.cmu_salarie,
        variant: "deduction",
        detail: "Forfait mensuel",
      },
      {
        label: "ITS brut (barème progressif)",
        montant: computed.its_brut,
        variant: "deduction",
        detail: `Tranche ${computed.tranche_its_appliquee} appliquée`,
      },
      ...(computed.ricf > 0
        ? [{
            label: "RICF — Réduction charge de famille",
            montant: computed.ricf,
            variant: "addition" as const,
            detail: `${computed.parts_fiscales} part${computed.parts_fiscales > 1 ? "s" : ""} fiscale${computed.parts_fiscales > 1 ? "s" : ""}`,
          }]
        : []),
      {
        label: "ITS salarial retenu",
        montant: computed.its_salarial,
        variant: "deduction",
        detail:
          computed.its_brut > computed.ricf
            ? `= ${fcfa(computed.its_brut)} − ${fcfa(computed.ricf)}`
            : `ITS brut ≤ RICF → 0`,
      },
      ...((Number(autresRetenues) || 0) > 0
        ? [{
            label: "Autres retenues",
            montant: Number(autresRetenues),
            variant: "deduction" as const,
          }]
        : []),
      ...((Number(avances) || 0) > 0
        ? [{
            label: "Avances / acomptes",
            montant: Number(avances),
            variant: "deduction" as const,
          }]
        : []),
      {
        label: "NET CALCULÉ",
        montant: computed.net_calcule,
        variant: "total",
        detail:
          Math.abs(computed.ecart) <= 1
            ? "Conforme au net souhaité"
            : `Écart : ${computed.ecart > 0 ? "+" : ""}${fcfa(computed.ecart)}`,
      },
    ];
  }, [computed, salaireBase, autresRetenues, avances]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 flex gap-3">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Saisissez le <strong>net souhaité</strong> et le <strong>salaire catégoriel</strong> :
          l&apos;outil calcule le <strong>sursalaire</strong> à ajouter pour atteindre exactement
          le net cible. Formule : <code className="text-xs">NET = BRUT − CNPS − CMU − max(0, ITS_brut − RICF)</code>.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Calculator className="h-4 w-4" /> Paramètres
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Net souhaité (FCFA) *</span>
            <input
              type="text"
              inputMode="numeric"
              value={netSouhaite}
              onChange={(e) => setNetSouhaite(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="ex : 350000"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Salaire catégoriel (FCFA) *</span>
            <input
              type="text"
              inputMode="numeric"
              value={salaireBase}
              onChange={(e) => setSalaireBase(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="ex : 150000"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Salaire de base contractuel (selon convention collective)
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Autres retenues (FCFA)</span>
            <input
              type="text"
              inputMode="numeric"
              value={autresRetenues}
              onChange={(e) => setAutresRetenues(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Avances / acomptes (FCFA)</span>
            <input
              type="text"
              inputMode="numeric"
              value={avances}
              onChange={(e) => setAvances(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors"
            />
          </label>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quotient familial (impacte le RICF et donc l&apos;ITS)
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-foreground">Situation matrimoniale</span>
              <select
                value={etatCivil}
                onChange={(e) => setEtatCivil(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors"
              >
                {ETATS_CIVILS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Nombre d&apos;enfants à charge</span>
              <input
                type="number"
                min={0}
                max={10}
                value={nbEnfants}
                onChange={(e) => setNbEnfants(e.target.value.replace(/[^0-9]/g, ""))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Marié = 2 parts · +0,5 part par enfant · plafond 5 parts
              </p>
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCalculer}
            className="flex-1 rounded-lg bg-foreground text-background py-2.5 px-4 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Calculer le sursalaire
          </button>
          {computed && (
            <button
              onClick={() => {
                setComputed(null);
                setNetSouhaite("350000");
                setSalaireBase("150000");
                setAutresRetenues("0");
                setAvances("0");
              }}
              className="rounded-lg border border-border text-muted-foreground py-2.5 px-4 text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {computed && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-indigo-600 dark:text-indigo-400">
                Sursalaire à fixer
              </p>
              <p className="text-base font-black tabular-nums leading-none text-indigo-900 dark:text-indigo-100">
                {fcfa(computed.sursalaire)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-emerald-600 dark:text-emerald-400">
                Net garanti
              </p>
              <p className="text-base font-black tabular-nums leading-none text-emerald-900 dark:text-emerald-100">
                {fcfa(computed.net_calcule)}
              </p>
            </div>
            <div className="rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-amber-600 dark:text-amber-400">
                ITS retenu
              </p>
              <p className="text-base font-black tabular-nums leading-none text-amber-900 dark:text-amber-100">
                {fcfa(computed.its_salarial)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted">
              <p className="text-sm font-semibold text-foreground">Décomposition du calcul</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {lignes.map((row, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-border/50 last:border-0",
                      row.variant === "total" && "bg-muted font-semibold"
                    )}
                  >
                    <td className="px-5 py-2.5 text-foreground/80">
                      {row.label}
                      {row.detail && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          {row.detail}
                        </span>
                      )}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-2.5 text-right tabular-nums",
                        row.variant === "deduction" && "text-red-500 dark:text-red-400",
                        row.variant === "addition" && "text-emerald-600 dark:text-emerald-400",
                        row.variant === "total" && "text-foreground font-bold"
                      )}
                    >
                      {row.variant === "deduction"
                        ? `− ${fcfa(row.montant)}`
                        : row.variant === "addition"
                          ? `+ ${fcfa(row.montant)}`
                          : fcfa(row.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
