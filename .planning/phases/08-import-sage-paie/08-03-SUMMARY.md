---
phase: 08-import-sage-paie
plan: "03"
subsystem: paie-import-ui
tags: [ui, server-component, client-component, drag-and-drop, sidebar, next14, typescript]
dependency_graph:
  requires:
    - app/api/paie/import-sage/route.ts (Wave 2 plan 02 — endpoint POST)
    - app/api/paie/import-sage/template/route.ts (Wave 2 plan 02 — endpoint GET)
  provides:
    - components/paie/SageImportDropzone.tsx
    - app/(dashboard)/paie/import-sage/page.tsx
  affects:
    - components/rh/SidebarNav.tsx (ajout entrée "Import Paie Sage")
tech_stack:
  added: []
  patterns:
    - Server Component (page shell sans data fetching)
    - Client Component drag-and-drop natif (sans react-dropzone)
    - FormData POST vers Route Handler
    - Toast feedback (sonner)
    - Affichage conditionnel erreurs / succès
key_files:
  created:
    - components/paie/SageImportDropzone.tsx
    - app/(dashboard)/paie/import-sage/page.tsx
  modified:
    - components/rh/SidebarNav.tsx
decisions:
  - "Drag-and-drop natif (onDrop + DataTransfer.files) — pas de react-dropzone pour rester cohérent avec DocumentUploadDialog.tsx"
  - "Icône UploadSimple (@phosphor-icons/react) utilisée dans SidebarNav — déjà importée dans le fichier"
  - "Sélecteur période = input type='month' natif HTML — minimaliste et compatible mobile"
  - "Pas de re-fetch automatique après import — l'utilisateur reçoit le toast + le compte et peut naviguer"
  - "page.tsx inclut export metadata pour cohérence SEO avec les autres pages paie"
metrics:
  duration: "6 minutes"
  completed_date: "2026-04-27"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
requirements_satisfied:
  - ISP-01
---

# Phase 08 Plan 03: Interface Import Sage Paie Summary

**One-liner:** Page Server Component `/paie/import-sage` + composant client `SageImportDropzone` (drag-and-drop natif, sélecteur période, feedback toast/erreurs) + entrée sidebar — zéro dépendance externe ajoutée.

## What Was Built

1. **`components/paie/SageImportDropzone.tsx`** — Composant client autonome :
   - Bouton "Télécharger le template Excel" → `window.location.href = "/api/paie/import-sage/template"`
   - Sélecteur de période `<input type="month">` avec défaut = mois en cours (`YYYY-MM`)
   - Zone drag-and-drop natif (onDrop + onDragOver) + clic pour ouvrir le file picker
   - Affichage du nom de fichier sélectionné + bouton X pour désélectionner
   - Bouton "Importer" disabled si pas de fichier ou loading en cours
   - Spinner Loader2 pendant le traitement
   - Feedback succès : Card verte + CheckCircle + compteur de lignes importées
   - Feedback erreurs : Card rouge + liste `Ligne N : message` + texte d'aide
   - Toast sonner : succès ou erreur selon réponse API

2. **`app/(dashboard)/paie/import-sage/page.tsx`** — Server Component shell :
   - `export const metadata = { title: "Import Paie Sage — RH Manager CI" }`
   - Header H1 + description sous-titre
   - `<SageImportDropzone />` intégré
   - Pas de `"use client"`, pas de data fetching

3. **`components/rh/SidebarNav.tsx`** — Ajout de l'entrée :
   - `{ href: "/paie/import-sage", label: "Import Paie Sage", icon: UploadSimple, exact: false }`
   - Insérée après `/paie/fin-de-contrat` dans le tableau navItems

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Composant SageImportDropzone (client) | ed81f05 | components/paie/SageImportDropzone.tsx |
| 2 | Page Server Component + entrée SidebarNav | 7e7bf2f | app/(dashboard)/paie/import-sage/page.tsx, components/rh/SidebarNav.tsx |

## Verification Results

```
# SageImportDropzone — critères
grep -c '"use client"|onDrop|handleImport|/api/paie/import-sage|periode' → 11 lignes

# Pas de any
grep ": any|as any" components/paie/SageImportDropzone.tsx → (vide)

# Pas d'erreurs TS sur les fichiers import-sage
npx tsc --noEmit 2>&1 | grep "import-sage" → (vide)

# Navigation
grep "/paie/import-sage" components/rh/SidebarNav.tsx → 1 ligne ✓
```

## Deviations from Plan

- Icône sidebar : `UploadSimple` utilisée au lieu de `ArrowUpTray` (non disponible dans @phosphor-icons/react) — même sémantique visuelle
- Gestionnaire d'erreur `catch {}` sans variable nommée (TypeScript strict) — conforme aux conventions du projet

## Known Stubs

None — l'UI est entièrement fonctionnelle et connectée aux deux endpoints réels.

## Self-Check: PASSED
