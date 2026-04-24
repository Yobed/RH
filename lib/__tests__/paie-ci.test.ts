import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  calculerITS,
  calculerBulletin,
  calculerBulletinComplet,
  calculerChargesPatronales,
  calculerPrimeAnciennete,
  calculerProvision13e,
  calculerIndemniteLicenciement,
  calculerSoldeDeCompte,
  calculerRetenuAbsence,
  formatAnciennete,
  SMIG_MENSUEL,
  PLAFOND_CNPS_MENSUEL,
  CMU_MENSUEL,
} from '@/lib/paie-ci';

describe('Constantes LF 2026', () => {
  it('SMIG_MENSUEL doit valoir 75 000 FCFA', () => {
    expect(SMIG_MENSUEL).toBe(75000);
  });
  
  it('PLAFOND_CNPS_MENSUEL doit valoir 1 647 315 FCFA', () => {
    expect(PLAFOND_CNPS_MENSUEL).toBe(1647315);
  });
  
  it('CMU_MENSUEL doit valoir 1 600 FCFA', () => {
    expect(CMU_MENSUEL).toBe(1600);
  });
});

describe('calculerITS', () => {
  it('retourne 0 si la base imposable est <= 0', () => {
    expect(calculerITS(0)).toBe(0);
    expect(calculerITS(-1000)).toBe(0);
  });

  it('retourne 0 pour un montant inférieur à la première tranche (ex: 75 000)', () => {
    expect(calculerITS(75000)).toBe(0);
  });

  it('calcule correctement pour un montant atteignant la tranche de 12% (ex: 100 000)', () => {
    // Tranche 1: 75 000 à 200 000 (12%)
    // Base de 100 000 -> 25 000 dans la tranche 12% -> 3000
    expect(calculerITS(100000)).toBe(3000);
  });

  it('calcule correctement pour un montant atteignant la tranche de 18% (ex: 250 001)', () => {
    // Tranche 1: 12% sur (200 000 - 75 000 = 125 000) -> 15 000
    // Tranche 2: 18% sur (250 001 - 200 000 = 50 001) -> 9 000.18
    // Total ITS -> 24000
    expect(calculerITS(250001)).toBe(24000);
  });

  it('calcule correctement pour un montant dépassant 600 000 (tranche 32%)', () => {
    // Tranche 1: 125 000 * 0.12 = 15 000
    // Tranche 2: 150 000 * 0.18 = 27 000
    // Tranche 3: 250 000 * 0.25 = 62 500
    // Tranche 4 (>600000): 200 000 * 0.32 = 64 000
    // Total pour 800 000 -> 168 500
    expect(calculerITS(800000)).toBe(168500);
  });
});

describe('calculerBulletin', () => {
  it('calcule un bulletin pour le SMIG (75 000)', () => {
    const res = calculerBulletin(75000);
    expect(res.salaire_brut).toBe(75000);
    // CNPS Retraite: 75000 * 6.3% = 4725
    expect(res.cnps_retraite).toBe(4725);
    expect(res.cmu_salarie).toBe(1600);
    expect(res.cnps_salarie).toBe(6325);
    
    // Base Imposable ITS: 75000 - 4725 - (75000 * 0.15 = 11250) = 59025
    expect(res.base_imposable).toBe(59025);
    // ITS(59025) = 0
    expect(res.its).toBe(0);
    expect(res.salaire_net).toBe(68675);
  });

  it('calcule un bulletin pour 2 000 000 (plafond CNPS testé)', () => {
    const res = calculerBulletin(2000000);
    
    // CNPS plafonné à 1 647 315 * 0.063 = 103781
    expect(res.cnps_retraite).toBe(103781);
    expect(res.cmu_salarie).toBe(1600);
    
    // Abattement: 2000000 * 0.15 = 300000
    // Base Imp: 2000000 - 103781 - 300000 = 1596219
    expect(res.base_imposable).toBe(1596219);
    
    // ITS de 1 596 219:
    // Tranche 1: 125000*0.12 = 15000, Tranche 2: 150000*0.18 = 27000, 
    // Tranche 3: 250000*0.25 = 62500, Tranche 4: (1596219-600000)*0.32 = 318790.08
    // Total ITS = 423290
    expect(res.its).toBe(423290);
    expect(res.salaire_net_avant_retenues).toBe(2000000 - (103781 + 1600) - 423290);
  });

  it('gère les sommes nulles', () => {
    const res = calculerBulletin(0);
    expect(res.its).toBe(0);
    expect(res.cnps_salarie).toBe(1600); // Forfait mensuel s'applique quand même
    expect(res.salaire_net).toBe(0); // Protégé car salaire net >= 0
  });

  it('déduit les avances correctement', () => {
    const sansAvance = calculerBulletin(200000);
    const avecAvance = calculerBulletin(200000, 0, 50000);
    expect(avecAvance.salaire_net).toBe(sansAvance.salaire_net - 50000);
  });
});

describe('calculerBulletinComplet', () => {
  it('exclut la prime de transport de la base imposable et de la CNPS', () => {
    const res = calculerBulletinComplet({
      salaire_brut: 150000,
      prime_transport: 20000
    });
    
    expect(res.total_brut).toBe(170000);
    expect(res.total_imposable).toBe(150000);
    
    // CNPS: 150000 * 0.063 = 9450
    expect(res.cnps_salarie).toBe(9450);
    
    // Base ITS: 150000 - 9450 = 140550
    // Base abattue: 140550 * 0.85 = 119468
    // ITS: (119468 - 75000) * 0.12 = 5336
    expect(res.its).toBe(5336);
  });

  it('inclut la prime anciennete dans la base brute et imposable', () => {
    const res = calculerBulletinComplet({
      salaire_brut: 200000,
      prime_anciennete: 10000
    });
    expect(res.total_brut).toBe(210000);
    expect(res.total_imposable).toBe(210000);
    expect(res.cnps_salarie).toBe(13230); // 210000 * 0.063 = 13230
  });

  it('plafonne la CNPS à 1 647 315 2 000 000 de brutal', () => {
    const res = calculerBulletinComplet({
      salaire_brut: 2000000
    });
    // CNPS = 1647315 * 0.063 = Math.round(103780.845) = 103781
    expect(res.cnps_salarie).toBe(103781);
  });
});

describe('calculerChargesPatronales', () => {
  it('calcule correctement pour SMIG (75 000)', () => {
    const res = calculerChargesPatronales(75000);
    // pl familiale: 70000 * 0.05 = 3500
    expect(res.familiales).toBe(3500);
    // maternite: 75000 * 0.0075 = 563
    expect(res.maternite).toBe(563);
    // retraite: 75000 * 0.077 = 5775
    expect(res.retraite).toBe(5775);
    // at_mp: 75000 * 0.03 = 2250
    expect(res.at_mp).toBe(2250);
    // cmu: 1600
    expect(res.cmu).toBe(1600);
    // fdfp: 75000 * 0.01 = 750
    expect(res.fdfp).toBe(750);
    
    expect(res.total).toBe(3500 + 563 + 5775 + 2250 + 1600 + 750);
  });

  it('plafonne la base des prestations familiales et la retraite au délà de 1 647 315', () => {
    const res = calculerChargesPatronales(2000000);
    expect(res.familiales).toBe(3500); // 70000 * 0.05 = 3500
    expect(res.retraite).toBe(126843); // 1647315 * 0.077 = 126843
    expect(res.total).toBeGreaterThan(14438);
  });
});

describe('calculerPrimeAnciennete', () => {
  it('retourne 0 si anciennete < 1 an', () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6); // 6 mois
    expect(calculerPrimeAnciennete(100000, d.toISOString())).toBe(0);
  });

  it('retourne la prime avec le taux qui correspond aux nombre dannées', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 5); // 5 ans
    // 5 ans = 5% => 100000 * 5% = 5000
    expect(calculerPrimeAnciennete(100000, d.toISOString())).toBe(5000);
  });

  it('plafonne à 25% après 25 ans et 30 ans (Interprofessionnelle)', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 26);
    expect(calculerPrimeAnciennete(100000, d.toISOString())).toBe(25000); // 25% plafond

    const d30 = new Date();
    d30.setFullYear(d30.getFullYear() - 30);
    expect(calculerPrimeAnciennete(100000, d30.toISOString())).toBe(25000); // 25% plafond
  });

  it('convention BTP : plafond limité à 20% après 25 ans', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 26);
    // BTP plafonne à 20% => 100000 * 20% = 20000
    expect(calculerPrimeAnciennete(100000, d.toISOString(), 'BTP')).toBe(20000);
  });

  it('convention BTP : calcul normal pour 10 ans (10%)', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 10);
    // 10 ans * 1% = 10% => 100000 * 10% = 10000 (identique à Interprofessionnelle)
    expect(calculerPrimeAnciennete(100000, d.toISOString(), 'BTP')).toBe(10000);
  });

  it('convention Commerce : plafond identique à CCI (25%)', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 30);
    expect(calculerPrimeAnciennete(100000, d.toISOString(), 'Commerce')).toBe(25000);
  });
});

describe('calculerProvision13e', () => {
  it('calcule la provision en fonction du SMIG', () => {
    // 75000 * 0.75 / 12 = 4688
    expect(calculerProvision13e(75000)).toBe(4688);
  });
  
  it('retourne 0 si la valeur de base est nulle', () => {
    expect(calculerProvision13e(0)).toBe(0);
  });
});

describe('calculerIndemniteLicenciement', () => {
  it('retourne 0 indemnité si moins de 1 an', () => {
    expect(calculerIndemniteLicenciement(100000, 0.5)).toBe(0);
  });

  it('applique correctement la première tranche (1-5 ans) : 30%', () => {
    // 5 ans : 5 * (100000 * 0.3) = 150000
    expect(calculerIndemniteLicenciement(100000, 5)).toBe(150000);
  });

  it('applique correctement un échelonnement de tranches (par exemple 8 ans)', () => {
    // 5 premières années : 5 * 30000 = 150000
    // 3 suivantes (6-8) : 3 * 35000 = 105000
    // Total = 255000
    expect(calculerIndemniteLicenciement(100000, 8)).toBe(255000);
  });

  it('applique correctement la dernière tranche (> 10 ans)', () => {
    // 5 premières années : 150000
    // 5 années (6-10) : 5 * 35000 = 175000
    // 2 années suivantes (11-12) : 2 * 40000 = 80000
    // Total = 405000
    expect(calculerIndemniteLicenciement(100000, 12)).toBe(405000);
  });

  it('calcule la fraction dannée', () => {
    // 2.5 ans -> tranche de 30% -> (2 * 30000) + (0.5 * 30000) = 75000
    expect(calculerIndemniteLicenciement(100000, 2.5)).toBe(75000);
    
    // 6.5 ans -> 5 * 30000 + 1.5 * 35000 = 150000 + 52500 = 202500
    expect(calculerIndemniteLicenciement(100000, 6.5)).toBe(202500);
  });
});

describe('formatAnciennete', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-30T12:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('calcule correctement pour 0 année et 0 mois', () => {
    expect(formatAnciennete('2026-03-25T12:00:00Z')).toMatch(/5 jours/);
  });

  it('calcule correctement pour plusieurs mois', () => {
    expect(formatAnciennete('2026-01-30T12:00:00Z')).toMatch(/00 an 02 mois/);
  });

  it('calcule correctement pour plusieurs années', () => {
    expect(formatAnciennete('2023-02-15T12:00:00Z')).toMatch(/03 ans 01 mois/);
  });
});

describe('calculerRetenuAbsence', () => {
  it('cas standard : 3 jours absence sur 300 000 FCFA brut → 34 615 FCFA', () => {
    // Math.round(300000 / 26 * 3) = Math.round(34615.38...) = 34615
    expect(calculerRetenuAbsence(3, 300000)).toBe(34615);
  });

  it('retourne 0 si nb_jours_absence est 0', () => {
    expect(calculerRetenuAbsence(0, 300000)).toBe(0);
  });

  it('retourne 0 si nb_jours_absence est négatif (cas défensif)', () => {
    expect(calculerRetenuAbsence(-1, 300000)).toBe(0);
  });

  it('mois entier : 26 jours sur 100 000 FCFA → 100 000 FCFA', () => {
    expect(calculerRetenuAbsence(26, 100000)).toBe(100000);
  });

  it('SMIG CI : 1 jour sur 75 000 FCFA → 2 885 FCFA', () => {
    // Math.round(75000 / 26 * 1) = Math.round(2884.61...) = 2885
    expect(calculerRetenuAbsence(1, 75000)).toBe(2885);
  });
});

describe('calculerBulletinComplet avec absences', () => {
  it('intègre retenu_absence dans total_retenues pour 3 jours absent', () => {
    const res = calculerBulletinComplet({
      salaire_brut: 300000,
      nb_jours_absence: 3,
    });
    expect(res.retenu_absence).toBe(34615);
    // total_retenues inclut la retenue absence
    const sansAbsence = calculerBulletinComplet({ salaire_brut: 300000 });
    expect(res.total_retenues).toBe(sansAbsence.total_retenues + 34615);
    expect(res.salaire_net).toBe(sansAbsence.salaire_net - 34615);
  });

  it('retenu_absence vaut 0 si pas d\'absence', () => {
    const res = calculerBulletinComplet({ salaire_brut: 300000 });
    expect(res.retenu_absence).toBe(0);
  });
});

describe('calculerSoldeDeCompte', () => {
  it('calcule correctement pour un CDI', () => {
    const stc = calculerSoldeDeCompte({
      type_contrat: 'CDI',
      salaire_moyen_12_mois: 100000,
      salaire_mensuel_actuel: 100000,
      anciennete_annees: 5, // 5 ans * 30% * 100000 = 150000
      jours_conges_restants: 22, // 22 * (100000 / 26) = 84615
      jours_preavis_non_effectues: 30, // 30 * (100000 / 26) = 115385
      somme_salaires_bruts_cdd: 0,
    });
    
    expect(stc.indemnite_licenciement).toBe(150000);
    expect(stc.indemnite_precarite).toBe(0);
    expect(stc.indemnite_compensatrice_conges).toBe(84615);
    expect(stc.indemnite_preavis).toBe(115385);
    expect(stc.total_brut_stc).toBe(350000);
  });

  it('calcule correctement pour un CDD (avec précarité)', () => {
    const stc = calculerSoldeDeCompte({
      type_contrat: 'CDD',
      salaire_moyen_12_mois: 100000,
      salaire_mensuel_actuel: 100000,
      anciennete_annees: 1,
      jours_conges_restants: 10, // 10 * (100000 / 26) = 38462
      jours_preavis_non_effectues: 0,
      somme_salaires_bruts_cdd: 1200000, // 3% = 36000
    });
    
    expect(stc.indemnite_licenciement).toBe(0);
    expect(stc.indemnite_precarite).toBe(36000);
    expect(stc.indemnite_compensatrice_conges).toBe(38462);
    expect(stc.indemnite_preavis).toBe(0);
    expect(stc.total_brut_stc).toBe(74462);
  });
});
