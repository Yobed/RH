---
phase: 01-stabilisation
plan: "03"
subsystem: paie
tags: [bulletins-paie, cnps, cmu, its, refactoring, security]

# Dependency graph
requires: [01-01, 01-02]
provides:
  - "calculerBulletinComplet(LignesBulletin) exportée depuis lib/paie-ci.ts"
  - "Calcul centralisé de la paie pour API et UI sans duplication"
  - "Filtre RLS / application: company_id appliqué sur les modifs de paie"
  - "Utilitaires isolés (scoreLabel, formatAnciennete)"
affects: [paie, rh, security]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Centralisation des algorithmes métiers purs (paie) dans une librairie sans React"
    - "Application stricte du filtre multi-tenant par company_id dans les API server-side"

key-files:
  created: []
  modified:
    - lib/paie-ci.ts
    - components/rh/PaieDialog.tsx
    - app/api/paie/[id]/route.ts
    - components/rh/EmployeeDialog.tsx
    - lib/utils-rh.ts

key-decisions:
  - "Suppression totale de previewCalc du front-end pour sourcer la vérité métier au back (librairie)."
  - "Injection dynamique du company_id par le profil lors des éditions PUT/PATCH."

patterns-established:
  - "Librairie métier pure / stateless dans @/lib/*"

requirements-completed: [SOC-02]

# Metrics
duration: 20min
completed: 2026-03-30
---

# Phase 1 Plan 03: Centralisation de la Logique de Paie Summary

**Centralisation de la logique de calcul des bulletins de la CNPS, CMU, ITS dans la lib commune, et sécurisation multi-tenant API.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-30T17:15:00Z
- **Completed:** 2026-03-30T17:35:00Z
- **Tasks:** 2 auto
- **Files modified:** 5

## Accomplishments

- Extraction de la logique métier (`previewCalc`) depuis le composant React `PaieDialog.tsx` au profit de `calculerBulletinComplet()` (`lib/paie-ci.ts`), garantissant ainsi le critère **SOC-02** (single source of truth).
- `LignesBulletin` et `ResultatPaieComplet` interface standardisées pour le calcul déconnecté des composants.
- Sécurisation de l'API `[id]/route.ts` via l'injection du filtre `company_id` prélevé par vérification du profil du _user_.
- L'appel aux informations temporelles (ex: `date_fin_contrat`) au sein d' `EmployeeDialog.tsx` qui effaçait la date existante en mode d'édition a été réparé.

## Interface Implementée

```typescript
export interface LignesBulletin {
  salaire_brut: number
  sursalaire?: number
  prime_anciennete?: number
  prime_exceptionnelle?: number
  prime_salissure?: number
  prime_depassement?: number
  prime_fonction?: number
  prime_transport?: number
  autres_retenues?: number
  avances?: number
}
```

## Decisions Made

- Conserver les dépendances partagées front-end / hooks React en injectant un "wrapper" de données via le composant form (`react-hook-form`).
- L'audit logging en DB pour l'opération `/api/paie` sécurisée a été étoffé pour garantir un tracing fiable.

## Deviations from Plan

- Aucune; les utilitaires `scoreLabel`, `formatAnciennete` ont aussi été mis en communs avec succès.
- J'ai dû ajuster le type local interne TypeScript `EmployeeWithPrimes` dans `EmployeeDialog.tsx` qui bloquait lors du fix `date_fin_contrat` car absent. `npx tsc --noEmit` a validé.

## Next Phase Readiness

- Plan 01-04 (Architecture des bulletins/exports PDF) est désormais viable car la source de paie est 100% fiable.

## Known Stubs

Aucun, l'application est clean.
