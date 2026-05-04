export interface CategorieConvention {
  code: string;
  libelle: string;
  salaire_minimum: number;
  coefficient: number;
}

export interface PrimeObligatoire {
  nom: string;
  calcul: string;
  montant_ou_taux: number;
  base: "salaire_base" | "smig" | "fixe";
}

export interface GrilleConvention {
  convention: string;
  categories: CategorieConvention[];
  primes_obligatoires: PrimeObligatoire[];
}

export const SMIG_CI = 75_000; // FCFA depuis 2023

export const CONVENTIONS_CI: Record<string, GrilleConvention> = {
  Commerce: {
    convention: "Convention Collective Interprofessionnelle du Commerce",
    categories: [
      { code: "1A", libelle: "Manœuvre ordinaire", salaire_minimum: 75_000, coefficient: 100 },
      { code: "1B", libelle: "Manœuvre spécialisé", salaire_minimum: 82_500, coefficient: 110 },
      { code: "2", libelle: "Ouvrier qualifié", salaire_minimum: 97_500, coefficient: 130 },
      { code: "3", libelle: "Agent de maîtrise", salaire_minimum: 150_000, coefficient: 200 },
      { code: "4", libelle: "Cadre débutant", salaire_minimum: 300_000, coefficient: 400 },
      { code: "5", libelle: "Cadre confirmé", salaire_minimum: 500_000, coefficient: 667 },
      { code: "6", libelle: "Cadre supérieur", salaire_minimum: 750_000, coefficient: 1000 },
    ],
    primes_obligatoires: [
      { nom: "Prime de transport", calcul: "Montant fixe mensuel", montant_ou_taux: 25_000, base: "fixe" },
      { nom: "Prime d'ancienneté", calcul: "2% par an, plafonné à 20%", montant_ou_taux: 0.02, base: "salaire_base" },
    ],
  },
  BTP: {
    convention: "Convention Collective du BTP",
    categories: [
      { code: "O1", libelle: "Manœuvre", salaire_minimum: 75_000, coefficient: 100 },
      { code: "O2", libelle: "Ouvrier spécialisé", salaire_minimum: 90_000, coefficient: 120 },
      { code: "O3", libelle: "Ouvrier qualifié", salaire_minimum: 112_500, coefficient: 150 },
      { code: "AM1", libelle: "Agent de maîtrise", salaire_minimum: 187_500, coefficient: 250 },
      { code: "AM2", libelle: "Agent de maîtrise supérieur", salaire_minimum: 262_500, coefficient: 350 },
      { code: "C1", libelle: "Cadre", salaire_minimum: 375_000, coefficient: 500 },
      { code: "C2", libelle: "Cadre supérieur", salaire_minimum: 750_000, coefficient: 1000 },
    ],
    primes_obligatoires: [
      { nom: "Prime de transport", calcul: "Montant fixe BTP", montant_ou_taux: 30_000, base: "fixe" },
      { nom: "Prime de panier", calcul: "Par jour travaillé sur chantier", montant_ou_taux: 2_500, base: "fixe" },
      { nom: "Prime d'ancienneté", calcul: "3% par an, plafonné à 25%", montant_ou_taux: 0.03, base: "salaire_base" },
    ],
  },
  Industrie: {
    convention: "Convention Collective Nationale de l'Industrie",
    categories: [
      { code: "P1", libelle: "Manœuvre", salaire_minimum: 75_000, coefficient: 100 },
      { code: "P2", libelle: "Ouvrier professionnel", salaire_minimum: 97_500, coefficient: 130 },
      { code: "P3", libelle: "Ouvrier hautement qualifié", salaire_minimum: 131_250, coefficient: 175 },
      { code: "TAM", libelle: "Technicien", salaire_minimum: 225_000, coefficient: 300 },
      { code: "IC1", libelle: "Ingénieur débutant", salaire_minimum: 450_000, coefficient: 600 },
      { code: "IC2", libelle: "Ingénieur confirmé", salaire_minimum: 750_000, coefficient: 1000 },
    ],
    primes_obligatoires: [
      { nom: "Prime de transport", calcul: "Montant fixe industrie", montant_ou_taux: 28_000, base: "fixe" },
      { nom: "Prime d'ancienneté", calcul: "2% par an, plafonné à 20%", montant_ou_taux: 0.02, base: "salaire_base" },
    ],
  },
  "Banque & Assurance": {
    convention: "Convention Collective des Banques et Établissements Financiers",
    categories: [
      { code: "E1", libelle: "Employé de bureau", salaire_minimum: 120_000, coefficient: 160 },
      { code: "E2", libelle: "Employé qualifié", salaire_minimum: 150_000, coefficient: 200 },
      { code: "AM", libelle: "Agent de maîtrise", salaire_minimum: 300_000, coefficient: 400 },
      { code: "C1", libelle: "Cadre", salaire_minimum: 500_000, coefficient: 667 },
      { code: "C2", libelle: "Cadre supérieur", salaire_minimum: 900_000, coefficient: 1200 },
    ],
    primes_obligatoires: [
      { nom: "Prime de transport", calcul: "Montant fixe banque", montant_ou_taux: 35_000, base: "fixe" },
      { nom: "Prime d'ancienneté", calcul: "2% par an, plafonné à 25%", montant_ou_taux: 0.02, base: "salaire_base" },
      { nom: "Prime de responsabilité", calcul: "5% du salaire de base pour cadres", montant_ou_taux: 0.05, base: "salaire_base" },
    ],
  },
};

export function calculerPrimesObligatoires(
  convention: string,
  salaireBase: number,
  ancienneteAns: number
): Array<{ nom: string; montant: number; calcul: string }> {
  const grille = CONVENTIONS_CI[convention];
  if (!grille) return [];

  return grille.primes_obligatoires.map((prime) => {
    let montant = 0;
    if (prime.base === "fixe") {
      montant = prime.montant_ou_taux;
    } else if (prime.base === "salaire_base") {
      // Prime d'ancienneté : taux × ancienneté, avec plafond
      if (prime.nom.toLowerCase().includes("anciennet")) {
        const tauxPlafond = prime.nom.toLowerCase().includes("25") ? 0.25 : 0.20;
        const taux = Math.min(prime.montant_ou_taux * ancienneteAns, tauxPlafond);
        montant = Math.round(salaireBase * taux);
      } else {
        montant = Math.round(salaireBase * prime.montant_ou_taux);
      }
    } else if (prime.base === "smig") {
      montant = Math.round(SMIG_CI * prime.montant_ou_taux);
    }
    return { nom: prime.nom, montant, calcul: prime.calcul };
  });
}
