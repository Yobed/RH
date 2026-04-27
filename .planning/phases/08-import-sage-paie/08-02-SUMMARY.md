---
phase: 08-import-sage-paie
plan: "02"
subsystem: paie-import
tags: [api, route-handler, xlsx, sage, payroll, multi-tenant, typescript]
dependency_graph:
  requires:
    - lib/paie-sage-import.ts (Wave 1 — COLUMN_MAPPING, cleanCurrency, extractEmployeeInfo, validateRequiredColumns, REQUIRED_COLUMNS)
    - supabase/migrations/20260427000000_payroll_logs.sql (Wave 1 — table cible)
  provides:
    - app/api/paie/import-sage/template/route.ts
    - app/api/paie/import-sage/route.ts
  affects:
    - app/(dashboard)/paie/import-sage/ (plan 08-03 — consomme ces deux endpoints)
tech_stack:
  added: []
  patterns:
    - Route Handler Next.js 14 App Router (GET + POST)
    - Detection automatique de la ligne d'en-tete Sage (scan 15 lignes)
    - Transaction applicative (zero insert si errors > 0)
    - Multi-tenant strict via company_id RLS
key_files:
  created:
    - app/api/paie/import-sage/template/route.ts
    - app/api/paie/import-sage/route.ts
  modified: []
decisions:
  - "Detection automatique du header par scan des 15 premieres lignes plutot qu'un header fixe — supporte Sage natif ET template SIRH avec le meme endpoint"
  - "Marker de detection = 'Jours de presence' (premiere colonne COLUMN_MAPPING apres Matricule/Nom)"
  - "Transaction applicative : si errors.length > 0 → return 422 immediatement, zero supabase.insert"
  - "REQUIRED_COLUMNS valides via validateRequiredColumns avant toute boucle ligne"
  - "Colonnes manquantes dans COLUMN_MAPPING sont silencieusement ignorees (fichier partiel supporte)"
metrics:
  duration: "8 minutes"
  completed_date: "2026-04-27"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
requirements_satisfied:
  - ISP-02
  - ISP-03
  - ISP-04
  - ISP-05
---

# Phase 08 Plan 02: Route Handlers Import Sage Paie Summary

**One-liner:** Route GET (template Excel 2 feuilles) + Route POST (detection header Sage automatique, mapping 22 colonnes COLUMN_MAPPING, cleanCurrency, insert payroll_logs) — zéro `any` TypeScript.

## What Was Built

Deux Route Handlers complets pour l'import Sage Paie :

1. **GET /api/paie/import-sage/template** (`app/api/paie/import-sage/template/route.ts`) — Génère un fichier `.xlsx` à la volée avec deux feuilles :
   - Feuille "Paie Sage" : 10 colonnes principales (Matricule/Nom, Jours de présence, Salaire de base, …, NET A PAYER) + une ligne d'exemple
   - Feuille "Instructions" : 7 lignes d'aide (export Sage, copier-coller, colonnes obligatoires/optionnelles, note sur la détection automatique du header)
   - `Content-Disposition: attachment; filename="template-import-sage.xlsx"`

2. **POST /api/paie/import-sage** (`app/api/paie/import-sage/route.ts`) — Traitement complet du fichier importé :
   - Auth check en premier (401 si non authentifié, 400 si company_id manquant)
   - Parse du formData (`file` + `periode` optionnel)
   - Détection automatique de la ligne d'en-tête : scan des 15 premières lignes pour trouver "Jours de présence" (fichier Sage natif) sinon `headerRowIndex = 0` (template SIRH)
   - Validation basique : fichier vide (400) ou > 1000 lignes (422)
   - Validation des colonnes requises via `validateRequiredColumns(REQUIRED_COLUMNS, rows[0])`
   - Boucle ligne par ligne : `extractEmployeeInfo` + mapping 22 colonnes via `Object.entries(COLUMN_MAPPING)` + `cleanCurrency` sur chaque valeur
   - Validation des colonnes obligatoires par ligne (`base_salary`, `net_to_pay`)
   - Transaction applicative : `if (errors.length > 0) return 422` — aucun `supabase.insert` si une erreur existe
   - Insert dans `payroll_logs` avec `company_id`, `employee_id`, `employee_name`, toutes les colonnes mappées, `periode`, `import_source: "sage"`, `imported_at`, `imported_by`
   - Réponse succès : `{ success: true, imported: N, errors: [] }`

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Route Handler GET — template Excel | 3dd1f45 | app/api/paie/import-sage/template/route.ts |
| 2 | Route Handler POST — detection header + mapping 22 colonnes + insert payroll_logs | 0e426fe | app/api/paie/import-sage/route.ts |

## Verification Results

```
# Template route
grep Content-Disposition|Paie Sage|Matricule|force-dynamic|NET A PAYER|Instructions → 12 lignes

# Import route — zero any
grep ": any|as any" app/api/paie/import-sage/route.ts → (vide)

# TypeScript
npx tsc --noEmit 2>&1 | grep import-sage → (vide — aucune erreur sur les nouveaux fichiers)
```

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — les deux endpoints retournent des données calculées réelles. Aucun placeholder.

## Self-Check: PASSED
