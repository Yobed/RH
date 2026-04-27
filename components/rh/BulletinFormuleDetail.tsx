"use client";

import {
  TAUX_CNPS_RETRAITE_SALARIE,
  PLAFOND_CNPS_MENSUEL,
  CMU_MENSUEL,
  TAUX_ABATTEMENT_ITS,
  TAUX_CN,
  CHARGES_PATRONALES_TAUX,
  calculerChargesPatronales,
} from "@/lib/paie-ci";

interface Props {
  bulletin: {
    salaire_brut: number;
    sursalaire?: number | null;
    prime_anciennete?: number | null;
    prime_exceptionnelle?: number | null;
    prime_salissure?: number | null;
    prime_depassement?: number | null;
    prime_fonction?: number | null;
    prime_transport?: number | null;
    vacation_allowance?: number | null;
    overtime_pay?: number | null;
    cnps_salarie: number;
    its: number;
    salaire_net: number;
    autres_retenues?: number | null;
    avances?: number | null;
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { maximumFractionDigits: 0 }).format(Math.round(n)) + " FCFA";

const pct = (n: number) => `${(n * 100).toFixed(2).replace(".", ",")} %`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="bg-[oklch(0.175_0.04_248)] px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[oklch(0.78_0.13_73)]">{title}</p>
      </div>
      <div className="bg-white dark:bg-[oklch(0.18_0.03_248)] divide-y divide-slate-50 dark:divide-slate-700/50">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  formula,
  result,
  highlight = false,
  note,
}: {
  label: string;
  formula: string;
  result: string;
  highlight?: boolean;
  note?: string;
}) {
  return (
    <div className={`px-4 py-3 ${highlight ? "bg-amber-50/40 dark:bg-amber-900/10" : ""}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${highlight ? "text-amber-800 dark:text-amber-300" : "text-slate-800 dark:text-slate-200"}`}>
            {label}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-600 break-all">{formula}</p>
          {note && <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-600 italic">{note}</p>}
        </div>
        <p className={`shrink-0 font-mono text-sm font-bold tabular-nums ${highlight ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"}`}>
          {result}
        </p>
      </div>
    </div>
  );
}

export function BulletinFormuleDetail({ bulletin: b }: Props) {
  const primeTransport = b.prime_transport ?? 0;
  const vacationAllowance = b.vacation_allowance ?? 0;
  const overtimePay = b.overtime_pay ?? 0;
  const sursalaire = b.sursalaire ?? 0;
  const primeAnciennete = b.prime_anciennete ?? 0;
  const primeExceptionnelle = b.prime_exceptionnelle ?? 0;
  const primeSalissure = b.prime_salissure ?? 0;
  const primeDepassement = b.prime_depassement ?? 0;
  const primeFonction = b.prime_fonction ?? 0;

  const totalBrut = b.salaire_brut + sursalaire + primeAnciennete + primeExceptionnelle
    + primeSalissure + primeDepassement + primeFonction + primeTransport
    + vacationAllowance + overtimePay;
  // Transport et indemnité congés payés sont exonérés
  const totalImposable = Math.max(0, totalBrut - primeTransport - vacationAllowance);

  const baseCnps = Math.min(totalImposable, PLAFOND_CNPS_MENSUEL);
  const cnpsRetraite = Math.round(baseCnps * TAUX_CNPS_RETRAITE_SALARIE);
  const cmu = CMU_MENSUEL;

  const baseItsAvantAbattement = Math.max(0, totalImposable - cnpsRetraite);
  const baseIts = Math.max(0, Math.round(baseItsAvantAbattement * (1 - TAUX_ABATTEMENT_ITS)));

  // Charges patronales (utilisant la fonction centralisée)
  const patronal = calculerChargesPatronales(b.salaire_brut);


  return (
    <div className="space-y-4 p-4 sm:p-6 max-w-3xl">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="h-9 w-9 rounded-xl bg-[oklch(0.175_0.04_248)] flex items-center justify-center shrink-0">
          <svg className="h-4 w-4 text-[oklch(0.78_0.13_73)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Détail des formules de calcul</h2>
          <p className="text-xs text-slate-500 dark:text-slate-600">Code du Travail CI · CGI Art. 116 · CNPS CI 2026</p>
        </div>
      </div>

      {/* 1. Éléments de rémunération */}
      <Section title="① Éléments de rémunération (Brut)">
        <Row label="Salaire catégoriel de base" formula="Ligne 01 — salaire fixé par catégorie" result={fmt(b.salaire_brut)} />
        {sursalaire > 0 && <Row label="Sursalaire" formula="Ligne 02 — avantage contractuel" result={fmt(sursalaire)} />}
        {primeAnciennete > 0 && (
          <Row
            label="Prime d'ancienneté"
            formula="5% / an jusqu'à 25 ans (Conv. Coll. Interpro. ASSIM-UGTCI)"
            result={fmt(primeAnciennete)}
            note="Art. 24 Convention Collective Interprofessionnelle"
          />
        )}
        {primeExceptionnelle > 0 && <Row label="Prime exceptionnelle" formula="Ligne 04 — non périodique, soumise ITS" result={fmt(primeExceptionnelle)} />}
        {primeSalissure > 0 && <Row label="Prime de salissure" formula="Ligne 05 — travaux salissants" result={fmt(primeSalissure)} />}
        {primeDepassement > 0 && <Row label="Prime de dépassement" formula="Ligne 06 — heures supplémentaires forfait" result={fmt(primeDepassement)} />}
        {primeFonction > 0 && <Row label="Prime de fonction" formula="Ligne 07 — responsabilité hiérarchique" result={fmt(primeFonction)} />}
        {primeTransport > 0 && (
          <Row
            label="Prime de transport"
            formula="Ligne 08 — NON soumise à CNPS ni ITS"
            result={fmt(primeTransport)}
            note="Exonérée de cotisations sociales et d'impôt"
          />
        )}
        {vacationAllowance > 0 && (
          <Row
            label="Indemnité congés payés"
            formula="Ligne 09 — NON soumise à CNPS ni IGR"
            result={fmt(vacationAllowance)}
            note="Exonérée — *** INDEMNITE EXONEREE *** (nomenclature Sage)"
          />
        )}
        {overtimePay > 0 && (
          <Row
            label="Heures supplémentaires"
            formula="Majorations 15% / 50% / 75% × taux horaire (Décret n°96-203)"
            result={fmt(overtimePay)}
          />
        )}
        <Row
          label="Total brut"
          formula={`Σ lignes 01→08 = ${fmt(totalBrut)}`}
          result={fmt(totalBrut)}
          highlight
        />
        {(primeTransport > 0 || vacationAllowance > 0) && (
          <Row
            label="Base imposable (brut − exonérations)"
            formula={`${fmt(totalBrut)} − ${fmt(primeTransport + vacationAllowance)} = *** BRUT FISCAL ***`}
            result={fmt(totalImposable)}
          />
        )}
      </Section>

      {/* 2. Retenues salariales — nomenclature Sage */}
      <Section title="② Retenues salariales — nomenclature Sage CI">
        <Row
          label="Retenue CNPS — retraite salariale (6,3%)"
          formula={`${pct(TAUX_CNPS_RETRAITE_SALARIE)} × min(Brut Social, plafond ${fmt(PLAFOND_CNPS_MENSUEL)})`}
          result={fmt(cnpsRetraite)}
          note={`Base plafonnée : ${fmt(baseCnps)} — CNPS CI Décret retraite 2026`}
        />
        <Row
          label="Retenue CNPS — CMU salariale (forfait)"
          formula="Forfait mensuel fixe — CNAM CI"
          result={fmt(cmu)}
        />
        <Row
          label="Retenue CNPS (total)"
          formula={`${fmt(cnpsRetraite)} + ${fmt(cmu)}`}
          result={fmt(cnpsRetraite + cmu)}
          highlight
        />
        <Row
          label="Base avant abattement (Brut Fiscal − CNPS retraite)"
          formula={`${fmt(totalImposable)} − ${fmt(cnpsRetraite)}`}
          result={fmt(baseItsAvantAbattement)}
        />
        <Row
          label="Abattement forfaitaire (15%)"
          formula={`${pct(TAUX_ABATTEMENT_ITS)} × ${fmt(baseItsAvantAbattement)} — CGI CI Art. 116`}
          result={fmt(Math.round(baseItsAvantAbattement * TAUX_ABATTEMENT_ITS))}
        />
        <Row
          label="Base nette après abattement"
          formula={`${fmt(baseItsAvantAbattement)} × ${pct(1 - TAUX_ABATTEMENT_ITS)}`}
          result={fmt(baseIts)}
        />
        <Row
          label="Contribution Nationale CN (1,5%)"
          formula={`${pct(TAUX_CN)} × Brut Fiscal (${fmt(totalImposable)})`}
          result={fmt(Math.round(totalImposable * TAUX_CN))}
          note="Contribution de solidarité — salarié"
        />
        <Row
          label="IGR — Impôt Général sur le Revenu (barème progressif)"
          formula="Barème mensuel CGI Art. 116 : 0% → 16% → 21% → 24% → 28% → 32%"
          result={fmt(b.its)}
          highlight
          note="Barème mensuel progressif sur base nette après abattement"
        />
        {(b.autres_retenues ?? 0) > 0 && (
          <Row label="Autres retenues" formula="Retenues diverses" result={fmt(b.autres_retenues ?? 0)} />
        )}
        {(b.avances ?? 0) > 0 && (
          <Row label="Avance paie négative" formula="Remboursement avances accordées" result={fmt(b.avances ?? 0)} />
        )}
        <Row
          label="*** TOTAL DES COTISATIONS ***"
          formula={`CNPS (${fmt(cnpsRetraite + cmu)}) + CN (${fmt(Math.round(totalImposable * TAUX_CN))}) + IGR (${fmt(b.its)})`}
          result={fmt(cnpsRetraite + cmu + Math.round(totalImposable * TAUX_CN) + b.its)}
          highlight
        />
        <Row
          label="*** NET AVANT RETENUE ***"
          formula={`*** SALAIRE BRUT *** (${fmt(totalBrut)}) − TOTAL COTISATIONS`}
          result={fmt(totalBrut - (cnpsRetraite + cmu + Math.round(totalImposable * TAUX_CN) + b.its))}
        />
        <Row
          label="NET A PAYER"
          formula="Net avant retenue − avances − autres retenues"
          result={fmt(b.salaire_net)}
          highlight
        />
      </Section>

      {/* 3. Charges patronales */}
      <Section title="③ Charges patronales CNPS CI & DGI (coût employeur)">
        <Row
          label="Prestations familiales"
          formula={`${pct(CHARGES_PATRONALES_TAUX.familiales)} × Brut`}
          result={fmt(patronal.familiales)}
        />
        <Row
          label="Accidents du travail / Maladies pro"
          formula={`${pct(CHARGES_PATRONALES_TAUX.maternite)} × Brut (maternité) + AT/MP`}
          result={fmt(patronal.maternite + patronal.at_mp)}
          note="Taux AT/MP variable selon secteur d'activité"
        />
        <Row
          label="Retraite patronale"
          formula={`${pct(CHARGES_PATRONALES_TAUX.retraite)} × min(Brut, plafond ${fmt(PLAFOND_CNPS_MENSUEL)})`}
          result={fmt(patronal.retraite)}
        />
        <Row
          label="TFC (FDFP + Ex. Formation)"
          formula={`${pct(CHARGES_PATRONALES_TAUX.fdfp)} × masse salariale brute`}
          result={fmt(patronal.fdfp)}
        />
        <Row
          label="Taxe d'Apprentissage"
          formula={`${pct(CHARGES_PATRONALES_TAUX.apprentissage)} × masse salariale brute`}
          result={fmt(patronal.apprentissage)}
        />
        <Row
          label="CMU patronale"
          formula="Forfait mensuel fixe par salarié"
          result={fmt(patronal.cmu)}
        />
        <Row
          label="Total charges patronales"
          formula="Σ cotisations employeur (CNPS + DGI)"
          result={fmt(patronal.total)}
          highlight
        />
        <Row
          label="Coût total employeur (TCO)"
          formula={`Brut (${fmt(totalBrut)}) + Charges patronales (${fmt(patronal.total)})`}
          result={fmt(totalBrut + patronal.total)}
          highlight
        />
      </Section>

      <p className="text-[10px] text-slate-600 text-center pt-2">
        Sources : Code du Travail CI Loi 2015-532 · CGI Art. 116 · Convention Collective Interprofessionnelle ASSIM-UGTCI · CNPS CI 2026
      </p>
    </div>
  );
}
