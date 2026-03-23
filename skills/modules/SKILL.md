# SKILL — Modules Métier RH (Droit ivoirien)
> Lis ce fichier avant de coder la logique d'un module RH.

## Module 1 — Contentieux
- Préavis CDI : 1 mois ouvriers, 3 mois cadres
- Indemnité licenciement : 1/12 salaire annuel × années ancienneté
- Délai saisine Inspection du Travail : 15 jours
- Prescription : 2 ans

```ts
function calculerIndemnite(salaireAnnuel: number, annees: number) {
  return Math.round((salaireAnnuel / 12) * annees)
}
```

## Module 2 — Contrats
- CDD : max 2 ans, renouvelable 2 fois max (CI)
- Période essai CDI : 1 mois ouvriers, 3 mois agents maîtrise, 6 mois cadres
- Au-delà 2 renouvellements CDD → CDI automatique
- Alertes : 30j, 15j, 7j, 1j avant expiration

```ts
function peutRenouvelerCDD(contrat: Contract) {
  if (contrat.renouvellement_count >= 2)
    return { possible: false, raison: "Doit être converti en CDI (droit ivoirien)" }
  return { possible: true }
}
```

## Module 3 — Archivage
Structure Storage : documents/{company_id}/{employee_id}/{famille}/
Familles : Contrat, Diplômes, Paie, Médical, Congés, Disciplinaire, Formation, Autre

## Module 4 — KPI Dashboard
- Effectif total, % femmes, turn-over, embauches 30j
- CDD expirant dans 30j
- Postes ouverts, délai moyen embauche
- Taux completion évaluations
- Cas contentieux ouverts

## Module 5 — Recrutement
États candidat : nouveau → en_cours → shortlist → entretien → offre → embauche / refus
Seuils scoring : >= 80 shortlist, >= 60 entretien, < 60 refus
Critères : Compétences 35%, Expérience 30%, Formation 20%, Adéquation 15%

## Module 6 — Évaluations
- Mensuel : Cron 0 9 1 * *
- Trimestriel : Cron 0 9 1 1,4,7,10 *
- Semestriel : Cron 0 9 1 1,7 *
- Annuel : Cron 0 9 1 12 *

Grille : >= 90 Exceptionnel, >= 75 Très satisfaisant, >= 60 Satisfaisant, >= 40 À améliorer, < 40 Insuffisant
