"use client";

import {
  TAUX_CNPS_RETRAITE_SALARIE,
  PLAFOND_CNPS_MENSUEL,
  CMU_MENSUEL,
  TAUX_ABATTEMENT_ITS,
  CHARGES_PATRONALES_TAUX,
  PLAFOND_FAMILIALES,
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
  const sursalaire = b.sursalaire ?? 0;
  const primeAnciennete = b.prime_anciennete ?? 0;
  const primeExceptionnelle = b.prime_exceptionnelle ?? 0;
  const primeSalissure = b.prime_salissure ?? 0;
  const primeDepassement = b.prime_depassement ?? 0;
  const primeFonction = b.prime_fonction ?? 0;

  const totalBrut = b.salaire_brut + sursalaire + primeAnciennete + primeExceptionnelle
    + primeSalissure + primeDepassement + primeFonction + primeTransport;
  const totalImposable = Math.max(0, totalBrut - primeTransport);

  const baseCnps = Math.min(totalImposable, PLAFOND_CNPS_MENSUEL);
  const cnpsRetraite = Math.round(baseCnps * TAUX_CNPS_RETRAITE_SALARIE);
  const cmu = CMU_MENSUEL;

  const baseItsAvantAbattement = Math.max(0, totalImposable - cnpsRetraite);
  const baseIts = Math.max(0, Math.round(baseItsAvantAbattement * (1 - TAUX_ABATTEMENT_ITS)));

  // Charges patronales
  const baseFamiliales = Math.min(b.salaire_brut, PLAFOND_FAMILIALES);
  const familialesPatron = Math.round(baseFamiliales * CHARGES_PATRONALES_TAUX.familiales);
  const maternitePatron = Math.round(b.salaire_brut * CHARGES_PATRONALES_TAUX.maternite);
  const baseCnpsPatron = Math.min(b.salaire_brut, PLAFOND_CNPS_MENSUEL);
  const retraitePatron = Math.round(baseCnpsPatron * CHARGES_PATRONALES_TAUX.retraite);
  const atMpPatron = Math.round(b.salaire_brut * CHARGES_PATRONALES_TAUX.at_mp);
  const fdfpPatron = Math.round(b.salaire_brut * CHARGES_PATRONALES_TAUX.fdfp);
  const cmuPatron = CMU_MENSUEL;
  const totalPatron = familialesPatron + maternitePatron + retraitePatron + atMpPatron + fdfpPatron + cmuPatron;

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
        <Row
          label="Total brut"
          formula={`Σ lignes 01→08 = ${fmt(totalBrut)}`}
          result={fmt(totalBrut)}
          highlight
        />
        {primeTransport > 0 && (
          <Row
            label="Base imposable (brut − transport)"
            formula={`${fmt(totalBrut)} − ${fmt(primeTransport)}`}
            result={fmt(totalImposable)}
          />
        )}
      </Section>

      {/* 2. Retenues salariales */}
      <Section title="② Retenues salariales (part salarié)">
        <Row
          label="CNPS Retraite salariale"
          formula={`${pct(TAUX_CNPS_RETRAITE_SALARIE)} × min(Base imposable, plafond ${fmt(PLAFOND_CNPS_MENSUEL)})`}
          result={fmt(cnpsRetraite)}
          note={`Base plafonnée : ${fmt(baseCnps)} → Art. CNPS CI — Décret retraite 2026`}
        />
        <Row
          label="CMU salariale"
          formula="Forfait mensuel fixe"
          result={fmt(cmu)}
          note="Couverture Maladie Universelle — CNAM CI"
        />
        <Row
          label="Total CNPS salarié (retraite + CMU)"
          formula={`${fmt(cnpsRetraite)} + ${fmt(cmu)}`}
          result={fmt(cnpsRetraite + cmu)}
          highlight
        />
        <Row
          label="Base ITS avant abattement"
          formula={`Base imposable (${fmt(totalImposable)}) − CNPS retraite (${fmt(cnpsRetraite)})`}
          result={fmt(baseItsAvantAbattement)}
        />
        <Row
          label="Abattement ITS forfaitaire"
          formula={`${pct(TAUX_ABATTEMENT_ITS)} × ${fmt(baseItsAvantAbattement)}`}
          result={fmt(Math.round(baseItsAvantAbattement * TAUX_ABATTEMENT_ITS))}
          note="Abattement CGI CI Art. 116 — déductible de la base ITS"
        />
        <Row
          label="Base ITS nette (après abattement)"
          formula={`${fmt(baseItsAvantAbattement)} × ${pct(1 - TAUX_ABATTEMENT_ITS)}`}
          result={fmt(baseIts)}
        />
        <Row
          label="ITS — Impôt sur Traitement et Salaires"
          formula={`Barème progressif CGI Art. 116 : 0% → 12% → 18% → 25% → 32%`}
          result={fmt(b.its)}
          highlight
          note="Barème mensuel : 0–75k = 0% · 75–200k = 12% · 200–350k = 18% · 350–600k = 25% · >600k = 32%"
        />
        {(b.autres_retenues ?? 0) > 0 && (
          <Row label="Autres retenues" formula="Retenues diverses (avances, etc.)" result={fmt(b.autres_retenues ?? 0)} />
        )}
        {(b.avances ?? 0) > 0 && (
          <Row label="Avances sur salaire" formula="Remboursement d'avances accordées" result={fmt(b.avances ?? 0)} />
        )}
        <Row
          label="Net à payer"
          formula={`Brut (${fmt(totalBrut)}) − CNPS (${fmt(cnpsRetraite + cmu)}) − ITS (${fmt(b.its)})`}
          result={fmt(b.salaire_net)}
          highlight
        />
      </Section>

      {/* 3. Charges patronales */}
      <Section title="③ Charges patronales CNPS CI (coût employeur)">
        <Row
          label="Prestations familiales"
          formula={`${pct(CHARGES_PATRONALES_TAUX.familiales)} × min(Brut, plafond ${fmt(PLAFOND_FAMILIALES)})`}
          result={fmt(familialesPatron)}
          note={`Base plafonnée : ${fmt(baseFamiliales)}`}
        />
        <Row
          label="Accidents du travail / Maladies pro"
          formula={`${pct(CHARGES_PATRONALES_TAUX.maternite)} × Brut (taux AT/MP = ${pct(CHARGES_PATRONALES_TAUX.at_mp)} taux moyen)`}
          result={fmt(maternitePatron + atMpPatron)}
          note="Taux AT/MP variable selon secteur d'activité"
        />
        <Row
          label="Retraite patronale"
          formula={`${pct(CHARGES_PATRONALES_TAUX.retraite)} × min(Brut, plafond ${fmt(PLAFOND_CNPS_MENSUEL)})`}
          result={fmt(retraitePatron)}
        />
        <Row
          label="FDFP (formation professionnelle)"
          formula={`${pct(CHARGES_PATRONALES_TAUX.fdfp)} × masse salariale brute`}
          result={fmt(fdfpPatron)}
        />
        <Row
          label="CMU patronale"
          formula="Forfait mensuel fixe par salarié"
          result={fmt(cmuPatron)}
        />
        <Row
          label="Total charges patronales"
          formula="Σ cotisations CNPS CI 2026"
          result={fmt(totalPatron)}
          highlight
        />
        <Row
          label="Coût total employeur (TCO)"
          formula={`Brut (${fmt(totalBrut)}) + Charges patronales (${fmt(totalPatron)})`}
          result={fmt(totalBrut + totalPatron)}
          highlight
        />
      </Section>

      <p className="text-[10px] text-slate-600 text-center pt-2">
        Sources : Code du Travail CI Loi 2015-532 · CGI Art. 116 · Convention Collective Interprofessionnelle ASSIM-UGTCI · CNPS CI 2026
      </p>
    </div>
  );
}
