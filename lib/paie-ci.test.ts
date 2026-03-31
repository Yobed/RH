import { describe, it, expect } from 'vitest';
import {
  calculerRetenuAbsence,
  calculerBulletinComplet,
} from '@/lib/paie-ci';

// ── calculerRetenuAbsence ──────────────────────────────────────────────────
describe('calculerRetenuAbsence — retenue absence non justifiée CI', () => {
  it('3 jours à 300 000 FCFA → 34 615 FCFA (300000/26×3 arrondi)', () => {
    expect(calculerRetenuAbsence(3, 300_000)).toBe(34_615);
  });

  it('0 jour → 0 (pas de retenue)', () => {
    expect(calculerRetenuAbsence(0, 300_000)).toBe(0);
  });

  it('-1 jour → 0 (cas défensif)', () => {
    expect(calculerRetenuAbsence(-1, 300_000)).toBe(0);
  });

  it('26 jours → 100 000 FCFA (mois entier)', () => {
    expect(calculerRetenuAbsence(26, 100_000)).toBe(100_000);
  });

  it('1 jour à 75 000 FCFA (SMIG CI) → 2 885 FCFA (75000/26 arrondi)', () => {
    expect(calculerRetenuAbsence(1, 75_000)).toBe(2_885);
  });
});

// ── calculerBulletinComplet avec nb_jours_absence ─────────────────────────
describe('calculerBulletinComplet — intégration retenue absence', () => {
  it('3 jours absence sur 300 000 FCFA → retenu_absence = 34 615', () => {
    const result = calculerBulletinComplet({
      salaire_brut: 300_000,
      nb_jours_absence: 3,
    });
    expect(result.retenu_absence).toBe(34_615);
  });

  it('3 jours absence inclus dans total_retenues', () => {
    const sanAbsence = calculerBulletinComplet({ salaire_brut: 300_000 });
    const avecAbsence = calculerBulletinComplet({
      salaire_brut: 300_000,
      nb_jours_absence: 3,
    });
    expect(avecAbsence.total_retenues).toBe(sanAbsence.total_retenues + 34_615);
  });

  it('3 jours absence → salaire_net diminué de 34 615 FCFA', () => {
    const sanAbsence = calculerBulletinComplet({ salaire_brut: 300_000 });
    const avecAbsence = calculerBulletinComplet({
      salaire_brut: 300_000,
      nb_jours_absence: 3,
    });
    expect(avecAbsence.salaire_net).toBe(sanAbsence.salaire_net - 34_615);
  });

  it('0 jour absence → retenu_absence = 0', () => {
    const result = calculerBulletinComplet({
      salaire_brut: 300_000,
      nb_jours_absence: 0,
    });
    expect(result.retenu_absence).toBe(0);
  });

  it('sans nb_jours_absence → retenu_absence = 0 (champ optionnel)', () => {
    const result = calculerBulletinComplet({ salaire_brut: 300_000 });
    expect(result.retenu_absence).toBe(0);
  });
});
