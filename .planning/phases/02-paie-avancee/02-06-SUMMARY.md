# Résumé — Phase 02-06 : Intégration Convention Collective

## Statut : ✅ Terminé

## Objectif

Paramétrer `calculerPrimeAnciennete` selon la convention collective (Interprofessionnelle, BTP, Commerce) afin que les calculs de paie respectent les règles propres à chaque secteur.

## Changements effectués

### `lib/paie-ci.ts`

- **Signature mise à jour** : `calculerPrimeAnciennete(salaireCat, dateEmbauche, convention = 'Interprofessionnelle')`
- **Logique multi-convention** :
  - `BTP` : plafond 20% (règle sectorielle BTP CI)
  - `Commerce` : plafond 25% (identique CCI)
  - `Interprofessionnelle` (défaut) : plafond 25%, 1% par an révolue

### `lib/__tests__/paie-ci.test.ts`

- Tests ajoutés : BTP plafond 20%, BTP calcul linéaire, Commerce plafond 25%
- **473 tests passés** (0 échec)

## Compatibilité descendante

✅ Le paramètre `convention` est **optionnel** — tout code existant appelant `calculerPrimeAnciennete(salaire, date)` sans la convention continue à fonctionner avec le comportement Interprofessionnelle.

## Prochaine étape suggérée

**Phase 03** — Tableau de bord analytique RH :

- Courbes d'évolution masse salariale
- Indicateurs de turnover
- Export PDF bulletins de paie
