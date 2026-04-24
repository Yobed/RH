---
phase: "02"
plan: "05"
subsystem: "paie"
tags: ["database", "backend", "frontend", "convention-collective", "fiscal"]
dependency_graph:
  requires: ["02-04-PLAN.md"]
  provides: ["fiscal_params table", "GET /api/settings", "PUT /api/settings"]
  affects: ["lib/paie-ci.ts (future)", "parametres page"]
tech_stack:
  added: []
  patterns: ["Supabase upsert onConflict", "RLS multi-tenant", "Server Component + Client Form"]
key_files:
  created:
    - "supabase/migrations/20260331091947_fiscal_params.sql"
    - "app/api/settings/route.ts"
  modified:
    - "types/supabase.ts"
    - "app/(dashboard)/parametres/page.tsx"
    - "components/rh/ParametresForm.tsx"
decisions:
  - "UNIQUE(company_id) sur fiscal_params — une seule convention par entreprise (upsert onConflict)"
  - "Valeurs enum convention côté API (CCI, Commerce, BTP, etc.) — validation Zod stricte"
  - "valeur_point stocké en NUMERIC(10,2) FCFA — utilisé à l'avenir dans lib/paie-ci.ts"
metrics:
  duration: "15 min"
  completed_date: "2026-03-31"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 3
---

# Phase 2 Plan 05: Multi-convention Collective Summary

## One-liner

Table `fiscal_params` avec RLS par tenant + endpoint API GET/PUT + section formulaire paramètres pour configurer convention collective (CCI, BTP, Commerce…) et valeur du point en FCFA.

## What Was Built

### Task 1 — Migration `fiscal_params`

Migration `supabase/migrations/20260331091947_fiscal_params.sql` créant la table `fiscal_params` :

- Colonnes : `id`, `company_id` (FK companies), `convention` (TEXT, défaut CCI), `valeur_point` (NUMERIC 10,2), `created_at`, `updated_at`
- `UNIQUE(company_id)` — une ligne par entreprise, permet l'upsert idempotent
- Trigger `updated_at` automatique
- RLS activé : SELECT / INSERT / UPDATE filtrés via `get_user_company_id()`
- `types/supabase.ts` mis à jour avec les types Row/Insert/Update de `fiscal_params`

### Task 2 — Interface et API

**`app/api/settings/route.ts`**

- `GET /api/settings` — retourne les `fiscal_params` de l'entreprise (maybeSingle, null si absent)
- `PUT /api/settings` — upsert avec validation Zod (enum convention + valeur_point >= 0)
- Auth vérifiée en premier, company_id via `get_user_company_id()`, jamais de bypass RLS

**`app/(dashboard)/parametres/page.tsx`**

- Charge `fiscal_params` côté serveur via Supabase Server Client
- Passe les données au composant `ParametresForm` via prop `fiscalParams`

**`components/rh/ParametresForm.tsx`**

- Nouvelle section "Paramètres de calcul salarial" après les infos légales entreprise
- `<select>` des 7 conventions (CCI, Commerce, BTP, Banque & Assurance, Transport, Industrie, Agriculture)
- Champ `valeur_point` (FCFA, nombre positif)
- Appel `PUT /api/settings` avec toast succès/erreur
- Type `ConventionType` explicite — aucun `any`

## Decisions Made

| Décision | Justification |
|---|---|
| UNIQUE(company_id) sur fiscal_params | Une seule convention par entreprise — upsert onConflict simplifie le code |
| Enum Zod strict côté API | Évite les valeurs arbitraires en base — 7 conventions CI reconnues |
| valeur_point = 0 par défaut | Entreprises sans point défini peuvent sauvegarder sans erreur |
| Section séparée dans ParametresForm | SRP — fiscal_params distinct du formulaire entreprise général |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — les données fiscal_params sont lues depuis Supabase et affichées dans le formulaire. La valeur du point et la convention seront consommées par `lib/paie-ci.ts` dans une phase ultérieure (prévu dans le plan).

## Self-Check

Files created/modified:

- `supabase/migrations/20260331091947_fiscal_params.sql` — FOUND
- `app/api/settings/route.ts` — FOUND
- `types/supabase.ts` — FOUND (modified)
- `app/(dashboard)/parametres/page.tsx` — FOUND (modified)
- `components/rh/ParametresForm.tsx` — FOUND (modified)

Commits:

- `c3a93c1` — feat(02-05): migration fiscal_params
- `eb23a94` — feat(02-05): interface paramètres convention collective

## Self-Check: PASSED
