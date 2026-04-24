---
phase: 03-conges-absences
plan: "03"
subsystem: ui
tags: [next.js, react, supabase, tailwind, shadcn, calendar, conges]

# Dependency graph
requires:
  - phase: 03-01
    provides: leave_balances migration + conges table avec statuts
  - phase: 03-02
    provides: workflow validation congés (en_attente → valide_manager → approuve)

provides:
  - Page /conges/calendrier — vue mensuelle calendrier des absences par employé
  - CongesCalendrierClient — grille interactive avec filtre département + navigation mois
  - Algorithme buildJoursCouvertsParEmploye (Map<employee_id, Map<date, type>>)
  - Vue mobile responsive (liste compacte sous md)

affects:
  - 03-04-absences
  - 03-05
  - tout module qui liste les congés par période

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component → Client Component data passing via props (pas de fetch client)
    - useMemo pour calculs coûteux (jours couverts, filtres employés)
    - URL sync avec état local (router.push + useState indépendant)
    - Tableau HTML sticky first column pour scroll horizontal calendrier

key-files:
  created:
    - app/(dashboard)/conges/calendrier/page.tsx
    - components/rh/CongesCalendrierClient.tsx
  modified: []

key-decisions:
  - "Données chargées côté serveur uniquement — Client Component reçoit tout en props (pas de fetch client pour éviter appels RLS répétés)"
  - "Navigation mois = état local + URL sync via router.push (pas revalidation serveur) — données du mois initial restent en props, changement de mois navigue vers nouvelle URL"
  - "useMemo sur buildJoursCouvertsParEmploye — O(n*31) per render évité, calculé une fois par [conges, moisAffiche]"

patterns-established:
  - "Server Component passe CongesCalendrierItem[] complet au Client — pas de props partielles"
  - "TYPE_COLORS Record<string, string> pour coloration — extensible sans modifier le composant"
  - "Vue desktop (hidden md:block) + vue mobile (block md:hidden) dans même composant"

requirements-completed:
  - CON-03

# Metrics
duration: 15min
completed: 2026-03-31
---

# Phase 03 Plan 03: Calendrier des Absences Summary

**Page /conges/calendrier avec grille mensuelle par employé colorée par type de congé, filtre département client-side, navigation mois avec URL sync, et vue mobile responsive**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-31T17:00:00Z
- **Completed:** 2026-03-31T17:06:32Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Page Server Component `/conges/calendrier` avec chargement Supabase des congés du mois (join employees) + extraction départements distincts
- CongesCalendrierClient : grille mensuelle HTML avec cellules colorées (TYPE_COLORS 7 types), colonnes weekend grisées, première colonne sticky pour scroll
- Filtre département client-side via Select shadcn — aucun rechargement, filtre `employeesFiltres` en useMemo
- Navigation mois précédent/suivant avec URL sync via `router.push` pour partage de lien
- Vue mobile : liste compacte `block md:hidden` avec badge coloré par type
- Légende des types de congés en bas de page

## Component Structure

**Props (Server → Client):**

```typescript
interface Props {
  conges: CongesCalendrierItem[]   // tous congés du mois (approuve|valide_manager|en_attente)
  departements: string[]            // liste distincte pour Select filtre
  moisInitial: string              // "YYYY-MM" — mois chargé côté serveur
}
```

**État local (Client):**

- `moisAffiche: string` — mois actuellement affiché (initialisé de moisInitial)
- `departementFiltre: string` — "tous" ou nom de département

**Algorithme calcul jours couverts:**

```
buildJoursCouvertsParEmploye(conges, mois) → Map<employee_id, Map<"YYYY-MM-DD", type>>
Pour chaque congé → pour chaque jour du mois → si jour in [date_debut, date_fin] → enregistrer type
Complexité : O(n_conges × 31) — mémoïsé avec useMemo
```

## Task Commits

1. **Task 1: Page Server Component calendrier** - `3cce322` (feat)
2. **Task 2: CongesCalendrierClient grille + filtre** - `3b5e09a` (feat)

## Files Created/Modified

- `app/(dashboard)/conges/calendrier/page.tsx` — Server Component force-dynamic, requête Supabase avec join, metadata
- `components/rh/CongesCalendrierClient.tsx` — Client Component, grille calendrier, filtre, navigation, mobile view, légende

## Decisions Made

- **Données serveur complètes en props** : Le Server Component charge les congés du mois entier et les passe en props. La navigation de mois (changement d'URL) rechargera la page serveur avec de nouvelles données. L'état local `moisAffiche` sert uniquement à l'affichage du label et au calcul côté client entre deux navigations.
- **URL sync via router.push** : Permet le partage de lien `/conges/calendrier?mois=2026-04` et le retour navigateur fonctionnel.
- **useMemo sur buildJoursCouvertsParEmploye** : Évite de recalculer O(n×31) à chaque interaction UI (filtre département ne doit pas re-déclencher ce calcul).
- **TYPE_COLORS Record extensible** : 7 types définis (annuel, maladie, maternite, paternite, arret_maladie, sans_solde, exceptionnel) avec fallback DEFAULT_COLOR pour types futurs.

## Deviations from Plan

None — plan executed exactly as written. Les deux fichiers étaient déjà présents dans le worktree (travail préalable d'un autre agent), conformes à toutes les spécifications du plan. TypeScript compile sans erreur.

## Issues Encountered

Aucun. Les deux fichiers existaient déjà dans le répertoire de travail comme fichiers untracked — ils ont été vérifiés pour conformité au plan puis committés atomiquement.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Route `/conges/calendrier` accessible depuis le menu congés (lien à ajouter dans la navigation si pas encore fait)
- Prêt pour 03-04 (retenue absences dans calcul paie) qui peut maintenant référencer les données de congés
- La vue calendrier complète le tableau de liste de 03-02 pour une gestion complète des congés

---
*Phase: 03-conges-absences*
*Completed: 2026-03-31*
