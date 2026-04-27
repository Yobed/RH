---
phase: 08-import-sage-paie
plan: "01"
subsystem: paie-import
tags: [migration, sql, rls, typescript, tdd, vitest, payroll, sage]
dependency_graph:
  requires: []
  provides:
    - supabase/migrations/20260427000000_payroll_logs.sql
    - lib/paie-sage-import.ts
    - lib/__tests__/paie-sage-import.test.ts
    - types/supabase.ts#payroll_logs
  affects:
    - app/api/paie/import-sage/route.ts (plan 08-02)
tech_stack:
  added: []
  patterns:
    - TDD vitest (RED → GREEN)
    - RLS isolation_company via get_user_company_id()
    - TypeScript strict (unknown au lieu de any)
key_files:
  created:
    - supabase/migrations/20260427000000_payroll_logs.sql
    - lib/paie-sage-import.ts
    - lib/__tests__/paie-sage-import.test.ts
  modified:
    - types/supabase.ts
decisions:
  - "employee_id TEXT NOT NULL (pas UUID FK) — valeur brute Sage, le matricule Sage peut diverger de l'UUID SIRH"
  - "Colonnes numériques NULLABLE — un champ absent dans le fichier Sage reste NULL (pas de valeur par défaut 0)"
  - "Pas de UNIQUE(company_id, employee_id, periode) — double import affiche avertissement côté API, ne bloque pas"
  - "REQUIRED_COLUMNS = [NET A PAYER, Salaire de base] — colonnes minimales pour un import valide"
metrics:
  duration: "4 minutes"
  completed_date: "2026-04-27"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 1
  tests_added: 22
  test_pass_rate: "100%"
requirements_satisfied:
  - ISP-03
  - ISP-04
  - ISP-05
---

# Phase 08 Plan 01: Fondations Import Sage — Migration SQL + Types + TDD Summary

**One-liner:** Table `payroll_logs` (22 colonnes Sage, RLS) + `SagePayrollImportService` TypeScript avec 22 tests Vitest verts à 100%.

## What Was Built

Trois artefacts constituent les fondations de l'import Sage Paie :

1. **Migration SQL** (`supabase/migrations/20260427000000_payroll_logs.sql`) — Table `payroll_logs` avec les 22 colonnes numériques exactes du `SagePayrollImportService` Python, RLS activé, politique `isolation_company` via `get_user_company_id()`, deux index sur `(company_id, periode)` et `(company_id, employee_id)`.

2. **Bibliothèque TypeScript** (`lib/paie-sage-import.ts`) — Équivalent TypeScript complet de `SagePayrollImportService` avec : `COLUMN_MAPPING` (22 entrées), `cleanCurrency` (nettoyage espaces insécables + virgule décimale Sage), `extractEmployeeInfo` (premier mot = matricule, reste = nom), `validateRequiredColumns` (retourne message d'erreur francophone pour première colonne manquante). Zéro `any` — types `unknown` + narrowing strict.

3. **Types Supabase** (`types/supabase.ts`) — Entrée `payroll_logs` avec 29 colonnes (Row/Insert/Update) insérée en ordre alphabétique entre `notifications` et `profiles`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migration SQL payroll_logs — 22 colonnes + RLS | 746d436 | supabase/migrations/20260427000000_payroll_logs.sql |
| 2 | lib/paie-sage-import.ts + tests TDD 22/22 | c9d7021 | lib/paie-sage-import.ts, lib/__tests__/paie-sage-import.test.ts |
| 3 | types/supabase.ts — payroll_logs Row/Insert/Update | 617b4ba | types/supabase.ts |

## Test Results

```
Test Files  1 passed (1)
     Tests  22 passed (22)
  Duration  1.64s
```

Couverture par describe :
- `cleanCurrency` : 11 cas (number natif, \xa0, narrow-no-break, espace+virgule, virgule seule, vide, null, undefined, non-numérique, 0, NaN)
- `extractEmployeeInfo` : 5 cas (nom complet, tiret, mot unique, vide, null)
- `validateRequiredColumns` : 2 cas (toutes présentes → null, manquante → message)
- `COLUMN_MAPPING` : 4 cas (compte 22 entrées, 3 mappings spot-check)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — aucun stub dans les fichiers créés. Les fonctions retournent des valeurs calculées réelles. Les types Supabase reflètent fidèlement le schéma SQL.

## Self-Check: PASSED
