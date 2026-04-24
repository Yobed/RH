---
phase: 03-conges-absences
plan: "02"
subsystem: conges-workflow
tags: [conges, workflow, validation, multi-niveau, state-machine, audit]
dependency_graph:
  requires: [03-01]
  provides: [workflow-validation-conges, audit-trail-conges, leave-balances-update]
  affects: [conges-page, leave-balances]
tech_stack:
  added: []
  patterns: [state-machine-api, multi-role-ui, zod-validation]
key_files:
  created: []
  modified:
    - supabase/migrations/20260401010000_conges_workflow.sql
    - types/supabase.ts
    - app/api/conges/[id]/route.ts
    - components/rh/CongesApprovalButton.tsx
    - app/(dashboard)/conges/page.tsx
decisions:
  - "V1 : canManagerApprove=true et canRhApprove=true pour tous — RBAC complet en phase suivante"
  - "leave_balances upsert (insert si absent) pour robustesse si row manquant"
  - "Dialog base-ui (composant ui/dialog.tsx existant) au lieu d'AlertDialog shadcn absent"
metrics:
  duration: "25min"
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_modified: 5
requirements_satisfied: [CON-02]
---

# Phase 03 Plan 02: Workflow Validation Multi-Niveaux Conges — Summary

**One-liner:** Machine a etats 3 etapes (employe->manager->RH) avec audit trail id+timestamp et mise a jour automatique leave_balances a l'approbation finale.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migration SQL statut etendu + colonnes audit | c27623d | supabase/migrations/20260401010000_conges_workflow.sql, types/supabase.ts |
| 2 | API PUT transitions + CongesApprovalButton + page conges | cdf04dc | app/api/conges/[id]/route.ts, components/rh/CongesApprovalButton.tsx, app/(dashboard)/conges/page.tsx |

## Machine a Etats Implementee

```
en_attente
    |
    +-- valider_manager --> valide_manager
    |                            |
    |                            +-- valider_rh --> approuve (+ jours_pris += nb_jours)
    |                            |
    |                            +-- refuser --> refuse (+ refus_motif)
    |
    +-- refuser --> refuse (+ refus_motif)

Toute autre transition -> 400 "Transition de statut invalide"
```

## Interface Body PUT /api/conges/[id]

```typescript
// Body
{
  action: "valider_manager" | "valider_rh" | "refuser";
  motif?: string; // optionnel, pour action "refuser"
}

// Reponses
// 200 : conge mis a jour (objet complet)
// 400 : Transition de statut invalide / Action invalide
// 401 : Non autorise
// 404 : Conge introuvable
// 500 : Erreur Supabase
```

## Props Finales de CongesApprovalButton

```typescript
interface Props {
  congeId: string;
  statut: string;          // statut courant du conge
  canManagerApprove: boolean; // l'utilisateur peut valider niveau manager
  canRhApprove: boolean;      // l'utilisateur peut approuver niveau RH
}
```

### Comportement selon statut

| statut | canManagerApprove=true | canRhApprove=true |
|--------|------------------------|-------------------|
| en_attente | Bouton "Valider (Manager)" + Bouton "Refuser" | — |
| valide_manager | — | Bouton "Approuver (RH)" + Bouton "Refuser" |
| approuve | Badge "Approuve" (vert) | Badge "Approuve" (vert) |
| refuse | Badge "Refuse" (rouge) | Badge "Refuse" (rouge) |

## Colonnes Audit

| Colonne | Remplie quand |
|---------|---------------|
| validated_by_manager_id | action valider_manager |
| validated_by_manager_at | action valider_manager |
| validated_by_rh_id | action valider_rh |
| validated_by_rh_at | action valider_rh |
| refus_motif | action refuser (optionnel) |

## Mise a Jour leave_balances

Uniquement lors de l'action `valider_rh` :

- Annee extraite de `date_debut` du conge
- Si row existant : `jours_pris += nb_jours`
- Si row absent : INSERT avec `jours_acquis=0, jours_pris=nb_jours`

## Page /conges — Deux Sections

1. **En attente de validation manager** : filtre `statut === "en_attente"`
2. **En attente de validation RH** : filtre `statut === "valide_manager"`
3. **Historique** : filtre `statut IN ("approuve", "refuse")` avec motif de refus affiche si renseigne

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Missing component] AlertDialog shadcn absent — utilise Dialog existant**

- **Found during:** Task 2
- **Issue:** Le plan mentionnait AlertDialog shadcn mais le composant n'est pas installe dans le projet (seuls badge, button, card, dialog, input, select, table, textarea sont presents)
- **Fix:** Utilise Dialog de ui/dialog.tsx (base-ui) deja disponible pour le modal de confirmation de refus
- **Files modified:** components/rh/CongesApprovalButton.tsx
- **Commit:** cdf04dc

**2. [Rule 2 - Missing feature] Acces conditionnel bouton Refuser**

- **Found during:** Task 2
- **Issue:** Le bouton "Refuser" doit etre visible selon le role — pas affiche si l'utilisateur ne peut pas agir
- **Fix:** `canRefuse && (canManagerApprove || canRhApprove)` comme condition de rendu
- **Commit:** cdf04dc

## Known Stubs

- `canManagerApprove = true` et `canRhApprove = true` sont hardcodes dans `app/(dashboard)/conges/page.tsx` (l.55-56) — RBAC complet prevu dans un plan futur. En V1, tous les utilisateurs connectes peuvent agir aux deux niveaux.

## Self-Check: PASSED

- supabase/migrations/20260401010000_conges_workflow.sql : FOUND (commit c27623d)
- types/supabase.ts colonnes workflow : FOUND (colonnes validated_by_manager_id, validated_by_manager_at, validated_by_rh_id, validated_by_rh_at, refus_motif presentes dans Row/Insert/Update)
- app/api/conges/[id]/route.ts machine a etats : FOUND (commit cdf04dc)
- components/rh/CongesApprovalButton.tsx multi-role : FOUND (commit cdf04dc)
- app/(dashboard)/conges/page.tsx deux sections : FOUND (commit cdf04dc)
- TypeScript : zero erreur (npx tsc --noEmit)
