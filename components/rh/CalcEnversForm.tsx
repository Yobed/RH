"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  calculerBrutDepuisNet,
  calculerBulletin,
  calculerChargesPatronales,
  CHARGES_PATRONALES_TAUX,
} from "@/lib/paie-ci";
import { Calculator, ArrowLeft, Info, TrendingUp, Wallet, User, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const fcfa = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(Math.round(n));

const pct = (part: number, total: number) =>
  total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0%";

const delta = (after: number, before: number) => {
  const diff = after - before;
  const sign = diff >= 0 ? "+" : "";
  return { label: `${sign}${fcfa(diff)}`, positive: diff >= 0, zero: diff === 0 };
};

interface ResultRow {
  label: string;
  montant: number;
  detail?: string;
  variant?: "deduction" | "total" | "neutral";
}

export interface EmpRow {
  id: string;
  full_name: string;
  matricule?: string | null;
  salaire_brut: number;
}

interface Props {
  employees?: EmpRow[];
}

export function CalcEnversForm({ employees = [] }: Props) {
  const [netSouhaite, setNetSouhaite] = useState<string>("250000");
  const [autresRetenues, setAutresRetenues] = useState<string>("0");
  const [avances, setAvances] = useState<string>("0");
  const [tauxAtMp, setTauxAtMp] = useState<number>(CHARGES_PATRONALES_TAUX.at_mp);
  const [computed, setComputed] = useState<ReturnType<typeof calculerBrutDepuisNet> | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");

  const selectedEmp = useMemo(
    () => employees.find((e) => e.id === selectedEmpId) ?? null,
    [employees, selectedEmpId]
  );

  // Situation actuelle de l'employé sélectionné
  const avant = useMemo(() => {
    if (!selectedEmp) return null;
    const bulletin = calculerBulletin(selectedEmp.salaire_brut);
    const pat = calculerChargesPatronales(selectedEmp.salaire_brut, tauxAtMp);
    return { bulletin, cout: selectedEmp.salaire_brut + pat.total };
  }, [selectedEmp, tauxAtMp]);

  const handleSelectEmp = useCallback((id: string) => {
    setSelectedEmpId(id);
    setComputed(null);
    if (id) {
      const emp = employees.find((e) => e.id === id);
      if (emp) {
        setNetSouhaite(String(calculerBulletin(emp.salaire_brut).salaire_net));
      }
    }
  }, [employees]);

  const handleCalculer = useCallback(() => {
    const result = calculerBrutDepuisNet(
      Number(netSouhaite) || 0,
      Number(autresRetenues) || 0,
      Number(avances) || 0,
    );
    setComputed(result);
  }, [netSouhaite, autresRetenues, avances]);

  const patronales = computed
    ? calculerChargesPatronales(computed.brut, tauxAtMp)
    : null;

  const coutTotal = computed && patronales
    ? computed.brut + patronales.total
    : null;

  const lignes: ResultRow[] = computed ? [
    { label: "Salaire brut à fixer", montant: computed.brut, variant: "total" },
    { label: "CNPS retraite salarié (6,30%)", montant: computed.details.cnps_retraite, variant: "deduction", detail: `Plafonné à 3 375 000 FCFA` },
    { label: "CMU salarié", montant: computed.details.cmu_salarie, variant: "deduction", detail: "Forfait mensuel" },
    { label: "ITS (barème progressif)", montant: computed.details.its, variant: "deduction", detail: `Base imposable : ${fcfa(computed.details.base_imposable)}` },
    ...((Number(autresRetenues) || 0) > 0 ? [{ label: "Autres retenues", montant: Number(autresRetenues), variant: "deduction" as const }] : []),
    ...((Number(avances) || 0) > 0 ? [{ label: "Avances / acomptes", montant: Number(avances), variant: "deduction" as const }] : []),
    { label: "NET À PAYER", montant: computed.details.salaire_net, variant: "total" },
  ] : [];

  const patronalesLignes: ResultRow[] = patronales ? [
    { label: "Prestations familiales (5%)", montant: patronales.familiales },
    { label: "Maternité (0,75%)", montant: patronales.maternite },
    { label: "Retraite patronale (7,7%)", montant: patronales.retraite, detail: "Plafonné à 3 375 000 FCFA" },
    { label: `AT/MP (${(tauxAtMp * 100).toFixed(1)}%)`, montant: patronales.at_mp, detail: "Variable selon secteur (2%–5%)" },
    { label: "CMU patronale", montant: patronales.cmu },
    { label: "FDFP (1,2%)", montant: patronales.fdfp },
    { label: "Apprentissage (0,4%)", montant: patronales.apprentissage },
    { label: "Total charges patronales", montant: patronales.total, variant: "total" },
  ] : [];

  const showComparison = !!avant && !!computed && !!coutTotal;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          Saisissez le <strong>net souhaité</strong> et l'outil calcule le brut à fixer, les cotisations exactes et le coût total employeur — selon le droit ivoirien 2026.
        </p>
      </div>

      {/* Formulaire */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Paramètres
        </h3>

        {/* Sélection employé (optionnel) */}
        {employees.length > 0 && (
          <label className="block">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Simuler pour un employé existant
              <span className="text-slate-400 font-normal">(optionnel)</span>
            </span>
            <select
              value={selectedEmpId}
              onChange={(e) => handleSelectEmp(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            >
              <option value="">— Simulation libre (sans employé) —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}{e.matricule ? ` — ${e.matricule}` : ""} ({fcfa(e.salaire_brut)} brut)
                </option>
              ))}
            </select>
            {selectedEmp && (
              <p className="text-xs text-slate-400 mt-1">
                Net actuel estimé : <strong>{fcfa(calculerBulletin(selectedEmp.salaire_brut).salaire_net)}</strong>
              </p>
            )}
          </label>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {selectedEmp ? "Net souhaité après augmentation (FCFA) *" : "Net souhaité (FCFA) *"}
            </span>
            <input
              type="number"
              min={0}
              step={1000}
              value={netSouhaite}
              onChange={(e) => setNetSouhaite(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Autres retenues (FCFA)</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={autresRetenues}
              onChange={(e) => setAutresRetenues(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Avances / acomptes (FCFA)</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={avances}
              onChange={(e) => setAvances(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Taux AT/MP (%)</span>
            <input
              type="number"
              min={2}
              max={5}
              step={0.1}
              value={Math.round(tauxAtMp * 1000) / 10}
              onChange={(e) => setTauxAtMp(Number(e.target.value) / 100)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <p className="text-xs text-slate-400 mt-1">Variable selon secteur (2%–5%)</p>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCalculer}
            className="flex-1 rounded-lg bg-slate-900 text-white py-2.5 px-4 text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            {computed
              ? "Recalculer"
              : selectedEmp ? "Simuler l'augmentation" : "Calculer le brut correspondant"}
          </button>
          {computed && (
            <button
              onClick={() => {
                setComputed(null);
                setNetSouhaite("250000");
                setAutresRetenues("0");
                setAvances("0");
                setSelectedEmpId("");
              }}
              className="rounded-lg border border-slate-200 text-slate-600 py-2.5 px-4 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Comparaison Avant / Après */}
      {showComparison && avant && computed && coutTotal && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 overflow-hidden">
          <div className="px-5 py-3 border-b border-indigo-100">
            <p className="text-sm font-semibold text-indigo-800">
              Impact de l'augmentation — {selectedEmp?.full_name}
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-indigo-100">
            {[
              {
                label: "Brut",
                avant: avant.bulletin.salaire_brut,
                apres: computed.brut,
              },
              {
                label: "Net garanti",
                avant: avant.bulletin.salaire_net,
                apres: computed.details.salaire_net,
              },
              {
                label: "Coût employeur",
                avant: avant.cout,
                apres: coutTotal,
              },
            ].map(({ label, avant: av, apres: ap }) => {
              const d = delta(ap, av);
              return (
                <div key={label} className="p-4 text-center">
                  <p className="text-xs text-indigo-600 font-medium mb-2">{label}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xs text-slate-400">Avant</span>
                      <span className="text-sm font-semibold text-slate-700">{fcfa(av)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xs text-slate-400">Après</span>
                      <span className="text-sm font-bold text-slate-900">{fcfa(ap)}</span>
                    </div>
                    <div className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      d.zero ? "bg-slate-100 text-slate-500" :
                      d.positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      {!d.zero && (d.positive
                        ? <TrendingUp className="h-3 w-3" />
                        : <TrendingDown className="h-3 w-3" />
                      )}
                      {d.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Résultats */}
      {computed && (
        <>
          {/* KPI rapides */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Brut à fixer", value: fcfa(computed.brut), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
              { label: "Net garanti", value: fcfa(computed.details.salaire_net), icon: Wallet, color: "text-emerald-600 bg-emerald-50" },
              { label: "Coût total employeur", value: coutTotal ? fcfa(coutTotal) : "—", icon: Calculator, color: "text-orange-600 bg-orange-50" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <div className={cn("inline-flex items-center justify-center rounded-lg p-2 mb-2", color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Décomposition bulletin */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-sm font-semibold text-slate-700">Décomposition du bulletin</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {lignes.map((row, i) => (
                  <tr key={i} className={cn("border-b border-slate-50 last:border-0", row.variant === "total" && "bg-slate-50 font-semibold")}>
                    <td className="px-5 py-2.5 text-slate-700">
                      {row.label}
                      {row.detail && <span className="ml-2 text-xs text-slate-400 font-normal">{row.detail}</span>}
                    </td>
                    <td className={cn("px-5 py-2.5 text-right tabular-nums", row.variant === "deduction" && "text-red-600", row.variant === "total" && "text-slate-900")}>
                      {row.variant === "deduction" ? `- ${fcfa(row.montant)}` : fcfa(row.montant)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-slate-400 w-20">
                      {row.variant !== "total" ? pct(row.montant, computed.brut) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charges patronales */}
          {patronales && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700">Charges patronales</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {patronalesLignes.map((row, i) => (
                    <tr key={i} className={cn("border-b border-slate-50 last:border-0", row.variant === "total" && "bg-slate-50 font-semibold")}>
                      <td className="px-5 py-2.5 text-slate-700">
                        {row.label}
                        {row.detail && <span className="ml-2 text-xs text-slate-400 font-normal">{row.detail}</span>}
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-slate-700">{fcfa(row.montant)}</td>
                    </tr>
                  ))}
                  {coutTotal && (
                    <tr className="bg-slate-900">
                      <td className="px-5 py-3 text-white font-bold">COÛT TOTAL EMPLOYEUR</td>
                      <td className="px-5 py-3 text-right tabular-nums text-white font-bold">{fcfa(coutTotal)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
