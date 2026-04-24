---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Executing Phase 03
last_updated: "2026-04-02T16:08:21.329Z"
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 19
  completed_plans: 14
---

# STATE.md — FichePaie RH

## Project Reference

Voir : `.planning/PROJECT.md` (mis à jour le 30 mars 2026)

**Valeur principale :** Éditer un bulletin conforme CI, gérer le dossier salarié complet, obtenir une réponse juridique fiable — sans formation technique.
## Project Status

- **Current Phase**: Phase 4 (Dossier Personnel & Cycle Contractuel)
- **Overall Completion**: 45%
- **Last Sync**: 24 avril 2026

## What's Working

- **Core RH**: Employees, Contracts, Companies CRUD.
- **Advanced Payroll (Phase 2)**: Overtime (HS), End of Contract (Dispositif, Indemnités), Monthly Payroll, Ledger (Journal de paie).
- **Leave & Absence (Phase 3)**: Leave balance calculation (2.5 days/month), Request/Approval workflow, Calendar view, Payroll integration (automatic deduction for unjustified absences), **Sick Leave Module** (AT declaration, justification upload).

## Recent Changes (Phase 3.5)

- Added `justificatif_url`, `est_justifie`, and `est_at` to `conges` table.
- Implemented `ArretMaladieDialog` with file upload to Supabase Storage.
- Implemented API route `/api/conges/arret` for multipart file processing.
- Added status badges ("AT", "Justifié", "Non justifié") to Leave lists.
- Integrated payroll logic: unjustified absences lead to deductions; justified sick leave is recorded with medical evidence.

## Current Focus

- Initializing Phase 4: **Dossier Personnel & Cycle Contractuel**
- Setting up the GED (Electronic Document Management) structure.
- Planning the transition from basic leave management to full career tracking.
- [x] REQUIREMENTS.md — 42 exigences v1 définies
- [x] ROADMAP.md — 7 phases créées
- [x] Phase 1 : Stabilisation (01-01 à 01-05 complétés)
- [ ] Phase 2 : Paie Avancée (02-01, 02-03, 02-04, 02-05 complétés — heures sup + masse salariale + export CSV + multi-convention collective)
- [ ] Phase 3 : Congés & Absences (03-01 complété — solde légal CI, 03-02 complété — workflow validation, 03-03 complété — calendrier absences)
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

*31 mars 2026 — Phase 2 Paie Avancée démarrée :*

- *02-01 : calculerHeuresSup (3 paliers +15%/+50%/+75%), PaieDialog UI, POST + PATCH API*
- *02-03 : MasseSalarialeDashboard (/paie/masse-salariale) + EmployeeCostSheet (coût réel par salarié)*
- *02-04 : Export journal de paie CSV — endpoint GET /api/paie/export + bouton PaieExportButton*
- *02-05 : Multi-convention collective — table fiscal_params + RLS + GET/PUT /api/settings + section paramètres de calcul dans ParametresForm*

*31 mars 2026 — Phase 3 Congés & Absences démarrée :*

- *03-01 : leave_balances migration + lib/conges-ci.ts (2,5j/mois Art. 25) + API GET/POST /api/conges/balance + widget solde fiche employé (8 tests TDD)*
- *03-02 : machine à états workflow congés (en_attente→valide_manager→approuve/refuse) + colonnes audit + API PUT /api/conges/[id] + CongesApprovalButton multi-rôle + page /conges deux files d'attente*
- *03-03 : page /conges/calendrier (Server Component) + CongesCalendrierClient (grille mensuelle colorée par type, filtre département, navigation mois URL sync, vue mobile)*

## Key Decisions

| Décision | Plan | Justification |
|---|---|---|
| Audit non bloquant dans audit_logs | 01-05 | Erreurs d'insert audit ignorées pour ne pas bloquer les opérations métier |
| Scripts scripts/ conservés comme référence | 01-05 | Ne pas supprimer la source originale des migrations |
| company_id RAG_UPLOAD via get_user_company_id() | 01-05 | Admin upload = context entreprise admin pour tracabilité |
| Heures sup incluses dans base imposable CNPS + ITS | 02-01 | Décret n°96-203 ne prévoit pas d'exonération explicite |
| Taux horaire = (brut + sursalaire) / 173.33 si absent | 02-01 | Évite blocage saisie — calculé automatiquement |
| HS stockées en JSONB details { heures_sup, heures_sup_montant } | 02-01 | Historique et réimpression du bulletin |
| Charges patronales calculées à la volée (pas stockées) | 02-03 | lib/paie-ci.ts source unique — pas de duplication |
| AT/MP 3% taux moyen avec avertissement affiché | 02-03 | Taux variable par secteur CNPS CI — transparence légale |
| Séparateur CSV point-virgule + BOM UTF-8 | 02-04 | Compatibilité Excel France/CI + affichage correct caractères accentués |
| Brouillons exclus de l'export CSV | 02-04 | Le journal comptable ne doit contenir que les bulletins validés/payés |
| UNIQUE(company_id) sur fiscal_params + upsert onConflict | 02-05 | Une seule convention par entreprise — simplifie le code et évite les doublons |
| Enum Zod strict pour convention côté API | 02-05 | 7 conventions CI reconnues — évite les valeurs arbitraires en base |
| Colonne solde GENERATED ALWAYS AS STORED | 03-01 | Base de données garantit la cohérence sans calcul applicatif |
| Mois complet = embauché le 1er du mois | 03-01 | Art. 25 CT-CI — présent dès le premier jour du mois |
| Calcul à la volée sans upsert au rendu | 03-01 | Écriture uniquement via API — pas d'effet de bord au rendu serveur |
| canManagerApprove=true et canRhApprove=true hardcodés en V1 | 03-02 | RBAC simplifié — tous les RH voient les deux files en v1 |
| leave_balances upsert (insert si absent) | 03-02 | Robustesse si row manquant — évite 404 silencieux |
| Données congés chargées côté serveur + passées en props Client | 03-03 | Pas de fetch client — évite appels RLS répétés côté navigateur |
| Navigation mois = état local + URL sync router.push | 03-03 | Permet partage de lien et retour navigateur fonctionnel |
| useMemo sur buildJoursCouvertsParEmploye | 03-03 | O(n×31) calculé une seule fois par [conges, moisAffiche] |

## Plan 01-02 Completion Note

*2026-03-30 — Plan 01-02 complété (champs légaux companies + bulletin conforme)*

- Migration SQL : `supabase/migrations/20260330120000_companies_legal_fields.sql`
- 5 colonnes ajoutées sur companies : raison_sociale, adresse, cnps_matricule, nccm, ncc
- SOC-03 satisfait : bulletin de paie conforme droit CI avec données légales entreprise
- Décisions : types/supabase.ts mis à jour manuellement (no 'any') | fallback raison_sociale ?? name | ADD COLUMN IF NOT EXISTS idempotent
