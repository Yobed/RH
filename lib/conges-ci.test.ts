import { describe, it, expect } from 'vitest';
import {
  calculerJoursAcquis,
  calculerSoldeConges,
  bonusCongesAnciennete,
  calculerICCP,
  TAUX_CONGES_PAR_MOIS,
  PLAFOND_CONGES_BASE,
} from '@/lib/conges-ci';

describe('Constantes légales', () => {
  it('Taux = 2,2 jours/mois (Art. 25.1 CT-CI)', () => {
    expect(TAUX_CONGES_PAR_MOIS).toBe(2.2);
  });
  it('Plafond base = 26,4 jours/an (2,2 × 12)', () => {
    expect(PLAFOND_CONGES_BASE).toBe(26.4);
  });
});

// ── Bonus ancienneté Art. 26 CT-CI ────────────────────────────────────────
describe('bonusCongesAnciennete — Art. 26 CT-CI', () => {
  it('0–4 ans → 0 jour bonus', () => {
    expect(bonusCongesAnciennete(0)).toBe(0);
    expect(bonusCongesAnciennete(4)).toBe(0);
  });
  it('5–9 ans → +1 jour', () => {
    expect(bonusCongesAnciennete(5)).toBe(1);
    expect(bonusCongesAnciennete(9)).toBe(1);
  });
  it('10–14 ans → +2 jours', () => {
    expect(bonusCongesAnciennete(10)).toBe(2);
    expect(bonusCongesAnciennete(14)).toBe(2);
  });
  it('15–19 ans → +3 jours', () => {
    expect(bonusCongesAnciennete(15)).toBe(3);
  });
  it('20–24 ans → +5 jours', () => {
    expect(bonusCongesAnciennete(20)).toBe(5);
  });
  it('25 ans et + → +7 jours', () => {
    expect(bonusCongesAnciennete(25)).toBe(7);
    expect(bonusCongesAnciennete(30)).toBe(7);
  });
});

// ── calculerJoursAcquis — (2,2 j/mois) ────────────────────────────────────
describe('calculerJoursAcquis — (2,2 j/mois)', () => {
  it('Embauché le 01/07/2025, année 2025 → 6 mois × 2,2 = 13,2 j', () => {
    expect(calculerJoursAcquis('2025-07-01', 2025)).toBe(13.2);
  });

  it('Embauché le 01/01/2025, année 2025 → 12 mois × 2,2 = 26,4 j', () => {
    expect(calculerJoursAcquis('2025-01-01', 2025)).toBe(26.4);
  });

  it('Embauché le 15/12/2025, année 2025 → 0 mois complets = 0 j', () => {
    expect(calculerJoursAcquis('2025-12-15', 2025)).toBe(0);
  });

  it('Embauché en 2020, année 2025 → plafond base 26,4 j (sans ancienneté)', () => {
    expect(calculerJoursAcquis('2020-01-01', 2025, 0)).toBe(26.4);
  });

  it('Embauché le 01/09/2025, année 2025 → 4 mois × 2,2 = 8,8 j', () => {
    expect(calculerJoursAcquis('2025-09-01', 2025)).toBe(8.8);
  });

  it('1 mois travaillé → 2,2 j', () => {
    expect(calculerJoursAcquis('2025-12-01', 2025)).toBe(2.2);
  });
});

// ── Majorations ancienneté intégrées ──────────────────────────────────────
describe('calculerJoursAcquis avec bonus ancienneté', () => {
  it('12 mois complets, 5 ans ancienneté → 26,4 + 1 = 27,4 j', () => {
    expect(calculerJoursAcquis('2020-01-01', 2025, 5)).toBe(27.4);
  });

  it('12 mois complets, 10 ans ancienneté → 26,4 + 2 = 28,4 j', () => {
    expect(calculerJoursAcquis('2015-01-01', 2025, 10)).toBe(28.4);
  });

  it('12 mois complets, 25 ans ancienneté → 26,4 + 7 = 33,4 j', () => {
    expect(calculerJoursAcquis('2000-01-01', 2025, 25)).toBe(33.4);
  });

  it('6 mois complets, 10 ans ancienneté → (6×2,2) + (2×6/12) = 13,2 + 1 = 14,2 j', () => {
    expect(calculerJoursAcquis('2025-07-01', 2025, 10)).toBe(14.2);
  });
});

// ── calculerSoldeConges ────────────────────────────────────────────────────
describe('calculerSoldeConges', () => {
  it('13,2 acquis, 5 pris → 8,2 restants', () => {
    expect(calculerSoldeConges(13.2, 5)).toBeCloseTo(8.2, 5);
  });

  it('Solde jamais négatif : 5 acquis, 10 pris → 0', () => {
    expect(calculerSoldeConges(5, 10)).toBe(0);
  });

  it('0 acquis, 0 pris → 0', () => {
    expect(calculerSoldeConges(0, 0)).toBe(0);
  });
});

// ── calculerICCP ──────────────────────────────────────────────────────────
describe('calculerICCP — Indemnité Compensatrice Congés Payés', () => {
  it('10 jours restants, salaire 780 000 FCFA → (780000/26)×10 = 300 000', () => {
    expect(calculerICCP(10, 780_000)).toBe(300_000);
  });

  it('0 jours → 0', () => {
    expect(calculerICCP(0, 500_000)).toBe(0);
  });

  it('salaire 0 → 0', () => {
    expect(calculerICCP(5, 0)).toBe(0);
  });
});
