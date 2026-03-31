import { describe, it, expect } from 'vitest';
import { calculerJoursAcquis, calculerSoldeConges } from '@/lib/conges-ci';

describe('calculerJoursAcquis — Art. 25 CT-CI (2,5 j/mois complet)', () => {
  it('Embauché le 01/07/2025, année 2025 → 6 mois × 2,5 = 15 j', () => {
    expect(calculerJoursAcquis('2025-07-01', 2025)).toBe(15.0);
  });

  it('Embauché le 01/01/2025, année 2025 → 12 mois × 2,5 = 30 j', () => {
    expect(calculerJoursAcquis('2025-01-01', 2025)).toBe(30.0);
  });

  it('Embauché le 15/12/2025, année 2025 → 0 mois complets = 0 j', () => {
    expect(calculerJoursAcquis('2025-12-15', 2025)).toBe(0);
  });

  it('Embauché le 01/01/2020, année 2025 → plafond 30 j (12 × 2,5 = 30)', () => {
    expect(calculerJoursAcquis('2020-01-01', 2025)).toBe(30.0);
  });

  it('Embauché le 01/09/2025, année 2025 → 4 mois × 2,5 = 10 j', () => {
    expect(calculerJoursAcquis('2025-09-01', 2025)).toBe(10.0);
  });
});

describe('calculerSoldeConges', () => {
  it('15 acquis, 5 pris → 10 restants', () => {
    expect(calculerSoldeConges(15, 5)).toBe(10);
  });

  it('Solde jamais négatif : 5 acquis, 10 pris → 0', () => {
    expect(calculerSoldeConges(5, 10)).toBe(0);
  });

  it('0 acquis, 0 pris → 0', () => {
    expect(calculerSoldeConges(0, 0)).toBe(0);
  });
});
