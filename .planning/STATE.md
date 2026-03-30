# STATE.md — FichePaie RH

## Project Reference

Voir : `.planning/PROJECT.md` (mis à jour le 30 mars 2026)

**Valeur principale :** Éditer un bulletin conforme CI, gérer le dossier salarié complet, obtenir une réponse juridique fiable — sans formation technique.
**Focus actuel :** Phase 1 — Stabilisation (01-05 complété — phase terminée)

## Current Status

**Milestone :** v1.0 — SaaS RH Ivoirien Complet
**Phase en cours :** Aucune (initialisation terminée — lancer `/gsd:plan-phase 1`)
**Dernière action :** Phase 1 complète — 01-05 terminé (sécurité RAG + audit_logs + migrations versionnées)

## Progress

- [x] Cartographie codebase (7 documents `.planning/codebase/`)
- [x] PROJECT.md initialisé
- [x] REQUIREMENTS.md — 42 exigences v1 définies
- [x] ROADMAP.md — 7 phases créées
- [x] Phase 1 : Stabilisation (01-01 à 01-05 complétés)
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
*30 mars 2026 — Phase 1 Stabilisation complétée (5 plans) :*
- *01-01 : types/supabase.ts synchronisé*
- *01-02 : champs légaux companies + bulletin conforme*
- *01-03 : lib/paie-ci.ts centralisé (calculs CI)*
- *01-04 : tests automatisés calculs fiscaux*
- *01-05 : sécurité RAG + audit_logs + migrations versionnées*

## Key Decisions

| Décision | Plan | Justification |
|---|---|---|
| Audit non bloquant dans audit_logs | 01-05 | Erreurs d'insert audit ignorées pour ne pas bloquer les opérations métier |
| Scripts scripts/ conservés comme référence | 01-05 | Ne pas supprimer la source originale des migrations |
| company_id RAG_UPLOAD via get_user_company_id() | 01-05 | Admin upload = context entreprise admin pour tracabilité |

## Plan 01-02 Completion Note

*2026-03-30 — Plan 01-02 complété (champs légaux companies + bulletin conforme)*
- Migration SQL : `supabase/migrations/20260330120000_companies_legal_fields.sql`
- 5 colonnes ajoutées sur companies : raison_sociale, adresse, cnps_matricule, nccm, ncc
- SOC-03 satisfait : bulletin de paie conforme droit CI avec données légales entreprise
- Décisions : types/supabase.ts mis à jour manuellement (no 'any') | fallback raison_sociale ?? name | ADD COLUMN IF NOT EXISTS idempotent
