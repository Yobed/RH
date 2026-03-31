---
phase: 02-paie-avancee
plan: "01"
subsystem: paie
tags: [paie, heures-supplementaires, calcul-ci, typescript, vitest, supabase, react]

# Dependency graph
requires:
  - phase: 01-stabilisation
    provides: lib/paie-ci.ts centralisé, calculerBulletinComplet, types Supabase synchronisés
provides:
  - calculerHeuresSup exportée (3 paliers +15%, +50%, +75%) — Décret CI n°96-203
  - calculerBulletinComplet étendu avec heures_sup et heures_sup_montant
  - UI PaieDialog avec saisie HS et aperçu temps réel
  - POST /api/paie et PATCH /api/paie/[id] avec HS dans JSONB details
affects:
  - 02-02-paie-avancee (solde tout compte)
  - impression bulletins (heures_sup_montant disponible dans details)
  - reporting masse salariale

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Taux horaire = (salaire_brut + sursalaire) / 173.33 si non fourni explicitement"
    - "HS stockées en JSONB details : { heures_sup: { h15, h50, h75 }, heures_sup_montant }"
    - "Montant HS inclus dans total_brut et total_imposable (soumis CNPS + ITS)"

key-files:
  created: []
  modified:
    - lib/paie-ci.ts
    - lib/__tests__/paie-ci.test.ts
    - components/rh/PaieDialog.tsx
    - app/api/paie/route.ts
    - app/api/paie/[id]/route.ts

key-decisions:
  - "Heures sup incluses dans la base imposable CNPS et ITS (pas d'exonération explicite dans le décret)"
  - "Taux horaire calculé automatiquement si absent : (brut + sursalaire) / 173.33"
  - "Données HS stockées dans JSONB details pour historique et impression bulletin"
  - "PATCH /api/paie/[id] mis à jour en même temps (cohérence création/modification)"

patterns-established:
  - "Pattern HS : calculerHeuresSup(h15, h50, h75, tauxHoraire) = Math.round(h15*taux*1.15 + h50*taux*1.50 + h75*taux*1.75)"
  - "Pattern LignesBulletin : heures_sup optionnel { h15, h50, h75 } + taux_horaire optionnel"

requirements-completed: [PAI-01]

# Metrics
duration: 35min
completed: 2026-03-31
---

# Phase 02 Plan 01: Heures Supplémentaires CI Summary

**Moteur de calcul HS conforme Décret CI n°96-203 avec 3 paliers de majoration (+15%/+50%/+75%), saisie dans PaieDialog, aperçu temps réel, stockage JSONB et 8 tests unitaires**

## Performance

- **Duration:** 35 min
- **Started:** 2026-03-31T05:51:00Z
- **Completed:** 2026-03-31T08:17:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Fonction `calculerHeuresSup(nbH15, nbH50, nbH75, tauxHoraire)` exportée depuis `lib/paie-ci.ts` — Décret CI n°96-203
- `calculerBulletinComplet` étendu : `heures_sup` dans `LignesBulletin`, `heures_sup_montant` dans `ResultatPaieComplet`
- UI `PaieDialog` : 3 champs numériques HS + prévisualisation montant en temps réel
- API POST et PATCH : HS injectées dans le calcul + enregistrées dans JSONB `details`
- 8 tests unitaires couvrant les 3 paliers, la formule légale exacte, les cas limites et l'intégration

## Task Commits

Chaque tâche commitée atomiquement :

1. **Task 1: Logique lib/paie-ci.ts** - `a1b6a85` (feat)
2. **Task 2: UI PaieDialog + API (+ fix PATCH)** - `5df04b5` (feat)

## Files Created/Modified

- `lib/paie-ci.ts` — `calculerHeuresSup` exportée, `LignesBulletin` + `ResultatPaieComplet` + `calculerBulletinComplet` étendus
- `lib/__tests__/paie-ci.test.ts` — 8 nouveaux tests unitaires pour `calculerHeuresSup`
- `components/rh/PaieDialog.tsx` — champs HS dans `BulletinEditable`, schéma Zod, form UI et preview
- `app/api/paie/route.ts` — POST accepte `heures_sup_h15/h50/h75`, calcul + JSONB
- `app/api/paie/[id]/route.ts` — PATCH idem pour mise à jour bulletins brouillon

## Decisions Made

- Heures supplémentaires incluses dans la base imposable CNPS et ITS (le Décret n°96-203 ne prévoit pas d'exonération)
- Taux horaire calculé automatiquement si non fourni (`(brut + sursalaire) / 173.33`) pour éviter de bloquer la saisie
- Données HS stockées en JSONB `details` (`{ heures_sup: { h15, h50, h75 }, heures_sup_montant }`) pour historique et réimpression
- PATCH `/api/paie/[id]` mis à jour simultanément avec le POST pour maintenir la cohérence création/modification

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Mise à jour PATCH /api/paie/[id] avec support HS**
- **Found during:** Task 2 (UI + API)
- **Issue:** Le plan mentionnait uniquement POST mais la PaieDialog utilise aussi PATCH pour l'édition des brouillons — sans mise à jour, les HS saisies en édition auraient été ignorées
- **Fix:** Mis à jour `editSchema`, appel `calculerBulletinComplet` et INSERT details dans le PATCH
- **Files modified:** `app/api/paie/[id]/route.ts`
- **Verification:** TypeScript compile sans erreur
- **Committed in:** `099f75f` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Correction nécessaire pour la cohérence création/modification. Pas de dérive de périmètre.

## Issues Encountered

Le worktree `agent-a9d91ae3` était à l'état de commit `a92aeb9` (Phase 1 terminée), avant les modifications déjà présentes dans le repo principal. L'implémentation a été réalisée complètement dans le worktree à partir de cet état de base.

## Known Stubs

Aucun stub — les heures supplémentaires sont entièrement câblées (UI → API → calcul → base de données).

## Next Phase Readiness

- `calculerHeuresSup` est disponible dans `lib/paie-ci.ts` pour toute réutilisation (bulletin impression, rapport masse salariale)
- `details.heures_sup` disponible pour l'impression du bulletin (02-xx si applicable)
- Prêt pour Plan 02-02 (Solde de tout compte) qui peut réutiliser `calculerBulletinComplet`

## Self-Check: PASSED

- FOUND: lib/paie-ci.ts
- FOUND: components/rh/PaieDialog.tsx
- FOUND: app/api/paie/route.ts
- FOUND: app/api/paie/[id]/route.ts
- FOUND commit: a1b6a85 (feat(02-01): calculerHeuresSup + calculerBulletinComplet avec heures sup)
- FOUND commit: 5df04b5 (feat(02-01): UI et API heures supplémentaires (saisie + calcul + persistance))

---
*Phase: 02-paie-avancee*
*Completed: 2026-03-31*
