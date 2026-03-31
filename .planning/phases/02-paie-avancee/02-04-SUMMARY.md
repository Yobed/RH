---
phase: "02"
plan: "04"
subsystem: "paie"
tags: ["export", "csv", "journal-paie", "backend", "frontend"]
dependency_graph:
  requires: ["02-03-PLAN.md"]
  provides: ["journal-paie-csv"]
  affects: ["app/(dashboard)/paie/page.tsx"]
tech_stack:
  added: []
  patterns: ["Route Handler CSV", "Client Component download blob"]
key_files:
  created:
    - "app/api/paie/export/route.ts"
    - "components/rh/PaieExportButton.tsx"
  modified:
    - "app/(dashboard)/paie/page.tsx"
decisions:
  - "Séparateur CSV point-virgule pour compatibilité Excel FR"
  - "BOM UTF-8 ajouté pour Excel Windows"
  - "Filtre statuts : validé, en_attente, payé (exclure brouillons)"
  - "Charges patronales recalculées à la volée dans l'export (pas stockées en DB)"
  - "CMU extraite de cnps_salarie (cnps_total - 1600) pour afficher séparément"
metrics:
  duration: "8 minutes"
  completed: "2026-03-31"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 2 Plan 04: Export journal de paie Summary

**One-liner:** Endpoint CSV `GET /api/paie/export?periode=YYYY-MM` avec BOM UTF-8 et bouton de téléchargement client intégré dans la page Paie.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Endpoint API CSV export journal de paie | c35c906 | app/api/paie/export/route.ts |
| 2 | Bouton téléchargement Export CSV sur page Paie | 1005c34 | components/rh/PaieExportButton.tsx, app/(dashboard)/paie/page.tsx |

## What Was Built

### Task 1 — Endpoint GET /api/paie/export

Fichier : `app/api/paie/export/route.ts`

- Authentification obligatoire + RLS via `createServerClient()` (jamais bypass)
- Paramètre `?periode=YYYY-MM` validé par regex
- Filtre bulletins sur les statuts `validé`, `en_attente`, `payé` (les brouillons exclus)
- Colonnes CSV standards comptable :
  - Matricule, Nom, Salaire Brut, Heures Sup, Retenues CNPS, Retenues ITS, Retenues CMU, Charges Patronales, Salaire Net, Mode de paiement
- Heures supplémentaires extraites du JSONB `details.heures_sup_montant`
- CMU extraite du champ `cnps_salarie` (cnps_salarie - 1 600 = CNPS retraite seule)
- Charges patronales recalculées à la volée depuis `lib/paie-ci.ts` (patron patronales : ~17,55% + CMU 1 600 FCFA)
- BOM UTF-8 (`\uFEFF`) pour affichage correct sous Excel Windows
- Séparateur point-virgule (`;`) — standard Excel France/CI
- Header `Content-Disposition: attachment; filename="Journal_Paie_YYYY_MM.csv"`

### Task 2 — Composant PaieExportButton

Fichier : `components/rh/PaieExportButton.tsx`

- `"use client"` — composant client avec `useState` pour gestion loading
- Fetch vers `/api/paie/export?periode=...`
- Déclenche le téléchargement via `URL.createObjectURL(blob)` + clic programmatique
- Revoke de l'URL après téléchargement (nettoyage mémoire)
- Toast `sonner` : succès (nom du fichier), avertissement (aucun bulletin), erreur (erreur réseau/API)
- Intégré dans l'en-tête de `/paie/page.tsx` à côté du bouton "Nouveau Bulletin"

## Decisions Made

| Décision | Justification |
|----------|--------------|
| Séparateur CSV `;` (point-virgule) | Standard Excel France et Côte d'Ivoire — évite problème avec virgule décimale |
| BOM UTF-8 inclus | Excel Windows n'ouvre pas correctement les CSV UTF-8 sans BOM |
| Statuts : validé + en_attente + payé | Les brouillons non validés ne doivent pas figurer dans le journal comptable |
| Charges patronales recalculées à la volée | Non stockées en DB (décision 02-03) — `lib/paie-ci.ts` source unique |
| CMU séparée de CNPS dans le CSV | Le comptable a besoin de voir les deux cotisations distinctement |

## Deviations from Plan

None — plan exécuté exactement tel qu'écrit.

## Known Stubs

None — toutes les colonnes CSV sont alimentées par des données réelles de la base.
Le champ `mode_paiement` est extrait de `employees.mode_paiement` ; s'il est null, la valeur par défaut `"Virement"` est utilisée.

## Self-Check: PASSED

- [x] `app/api/paie/export/route.ts` — créé
- [x] `components/rh/PaieExportButton.tsx` — créé
- [x] `app/(dashboard)/paie/page.tsx` — modifié avec import + bouton
- [x] Commit c35c906 — endpoint CSV
- [x] Commit 1005c34 — bouton UI
- [x] TypeScript noEmit — aucune erreur
