# STATE.md — FichePaie RH

## Project Reference

Voir : `.planning/PROJECT.md` (mis à jour le 30 mars 2026)

**Valeur principale :** Éditer un bulletin conforme CI, gérer le dossier salarié complet, obtenir une réponse juridique fiable — sans formation technique.
**Focus actuel :** Phase 1 — Stabilisation (prêt à planifier)

## Current Status

**Milestone :** v1.0 — SaaS RH Ivoirien Complet
**Phase en cours :** Aucune (initialisation terminée — lancer `/gsd:plan-phase 1`)
**Dernière action :** Initialisation GSD — PROJECT.md + REQUIREMENTS.md + ROADMAP.md créés

## Progress

- [x] Cartographie codebase (7 documents `.planning/codebase/`)
- [x] PROJECT.md initialisé
- [x] REQUIREMENTS.md — 42 exigences v1 définies
- [x] ROADMAP.md — 7 phases créées
- [ ] Phase 1 : Stabilisation
- [ ] Phase 2 : Paie Avancée
- [ ] Phase 3 : Congés & Absences
- [ ] Phase 4 : Dossier Personnel
- [ ] Phase 5 : Évaluations & Discipline
- [ ] Phase 6 : QHSE
- [ ] Phase 7 : Agent IA & Reporting

## Key Context

**Stack :** Next.js 14 App Router + TypeScript + Supabase + shadcn/ui + Claude API
**Multi-tenant :** RLS obligatoire — `get_user_company_id()` sur chaque requête
**Droit applicable :** Code du Travail CI 2026 — SMIG 75 000 FCFA, CNPS 6,3%, CMU 1 600 FCFA

**Problèmes critiques à traiter en Phase 1 :**
1. `types/supabase.ts` désynchronisé (4 migrations non reflétées)
2. Calcul de paie dupliqué 3× (centraliser dans `lib/paie-ci.ts`)
3. Colonnes `companies` manquantes (bulletin imprimé non conforme)
4. Zéro test automatisé sur les calculs fiscaux

## Session Notes

*Initialisation : 30 mars 2026*
*Codebase map créée avant l'initialisation via `/gsd:map-codebase`*
