---
phase: "03"
plan: "01"
subsystem: conges
tags: [conges, leave-balances, droit-ci, art25-ct-ci, rls, supabase, tdd]
dependency_graph:
  requires: []
  provides:
    - leave_balances (table Supabase avec RLS)
    - calculerJoursAcquis() dans lib/conges-ci.ts
    - calculerSoldeConges() dans lib/conges-ci.ts
    - GET /api/conges/balance
    - POST /api/conges/balance
  affects:
    - app/(dashboard)/employes/[id]/page.tsx
    - app/(dashboard)/conges/page.tsx
    - types/supabase.ts
tech_stack:
  added:
    - lib/conges-ci.ts (module calcul congés CI)
    - lib/conges-ci.test.ts (8 tests vitest)
    - supabase/migrations/20260401000000_leave_balances.sql
    - app/api/conges/balance/route.ts
  patterns:
    - Colonne GENERATED ALWAYS AS STORED pour solde (base de données source de vérité)
    - Calcul côté serveur sans upsert au rendu (écriture uniquement via API)
key_files:
  created:
    - lib/conges-ci.ts
    - lib/conges-ci.test.ts
    - supabase/migrations/20260401000000_leave_balances.sql
    - app/api/conges/balance/route.ts
  modified:
    - app/(dashboard)/employes/[id]/page.tsx (widget solde + imports)
    - app/(dashboard)/conges/page.tsx (2,2 → 2,5 jours/mois)
    - types/supabase.ts (ajout leave_balances)
decisions:
  - "Colonne solde GENERATED ALWAYS AS STORED : base de données garantit la cohérence, pas de calcul applicatif lors des lectures"
  - "Mois complet = embauché le 1er du mois (présent dès le premier jour ouvrable)"
  - "Calcul à la volée sans upsert au rendu de la fiche employé : performance + pas d'écriture implicite"
  - "GET API fait l'upsert uniquement si aucune ligne existante (lazy initialization)"
  - "Badge couleur solde : vert > 5j, orange 1-5j, rouge 0j"
metrics:
  duration_minutes: 7
  completed_date: "2026-03-31"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 3
---

# Phase 03 Plan 01 : Solde Congés Légaux CI — Summary

**One-liner :** Table `leave_balances` avec RLS + `calculerJoursAcquis()` (2,5j/mois, Art. 25 CT-CI) + API GET/POST balance + widget solde coloré sur fiche employé.

## Tâches exécutées

### Task 1 — Migration SQL + lib/conges-ci.ts (TDD)

**RED :** `lib/conges-ci.test.ts` créé avec 8 cas de test (5 pour `calculerJoursAcquis`, 3 pour `calculerSoldeConges`). Tests échouaient sur import manquant.

**GREEN :** `lib/conges-ci.ts` implémenté — tous les tests passent.

**Migration :** `supabase/migrations/20260401000000_leave_balances.sql` créée avec :
- Table `leave_balances` (id, company_id, employee_id, annee, jours_acquis, jours_pris, solde GENERATED, updated_at)
- RLS avec policy `get_user_company_id()`
- UNIQUE(company_id, employee_id, annee)
- Index `idx_leave_balances_employee(employee_id, annee)`

**Correction :** Page `/conges` corrigée — "2,2 jours/mois" → "2,5 jours/mois (Art. 25 CT-CI)", "26,4 jours/an" → "30 jours/an max".

**Commit :** `b86091c`

### Task 2 — API GET/POST balance + widget fiche employé

**API `app/api/conges/balance/route.ts` :**
- `GET ?employee_id=UUID&annee=YYYY` : retourne `SoldeConges` depuis `leave_balances`. Si aucune ligne, calcule avec `calculerJoursAcquis()` + somme des congés annuels approuvés, puis upsert.
- `POST { employee_id, annee }` : force le recalcul (upsert). Utile pour cron mensuelle.
- Auth 401 si non connecté. Validation Zod. Aucun `any`.

**types/supabase.ts :** Table `leave_balances` ajoutée avec Row/Insert/Update/Relationships.

**Fiche employé `app/(dashboard)/employes/[id]/page.tsx` :**
- Import de `calculerJoursAcquis` et `calculerSoldeConges`
- Requêtes parallèles ajoutées : `leave_balances` pour l'année en cours + `conges` annuels approuvés de l'année
- Calcul côté serveur si aucune ligne en base (pas d'upsert au rendu)
- Widget "Solde congés AAAA" avec 3 métriques : Acquis / Pris / Restant
- Badge coloré : vert (> 5j), orange (1-5j), rouge (0j)

**Commit :** `d18c7b4`

## Interfaces exportées depuis lib/conges-ci.ts

```typescript
export interface SoldeConges {
  jours_acquis: number;
  jours_pris: number;
  solde: number;
  annee: number;
}

export function calculerJoursAcquis(dateEmbauche: string, annee: number): number
export function calculerSoldeConges(joursAcquis: number, jours_pris: number): number
```

## Résultats de vérification

- `npx vitest run lib/conges-ci.test.ts` — 8/8 tests passants
- `npx tsc --noEmit` — zéro erreur TypeScript
- Migration SQL syntaxiquement valide
- Page `/conges` affiche "2,5 j/mois (Art. 25 CT-CI)"

## Deviations from Plan

### Auto-fixed Issues

None — plan exécuté exactement tel qu'écrit.

### Notes

- Le test supplémentaire "Embauché le 01/09/2025, année 2025 → 4 mois × 2,5 = 10 j" a été ajouté pour couvrir un cas intermédiaire non listé dans le plan mais utile pour la robustesse.
- Le test "Embauché le 01/01/2020, année 2025 → plafond 30 j" a été ajouté pour vérifier le plafonnement.

## Known Stubs

Aucun stub — les données sont calculées dynamiquement depuis `employees.date_embauche` et les congés approuvés en base. Le widget affiche des valeurs réelles ou calculées à la volée.

## Self-Check: PASSED
