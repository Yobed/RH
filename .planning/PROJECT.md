# FichePaie RH — SaaS RH Ivoirien

## What This Is

Plateforme SaaS RH multi-tenant destinée aux PME ivoiriennes. Elle couvre l'ensemble du cycle de vie salarié : gestion des employés et contrats, calcul des bulletins de paie (droit CI 2026), congés, suivi de carrière, documents RH, processus disciplinaires, et un agent IA spécialisé en droit du travail ivoirien. Chaque entreprise dispose d'un espace isolé avec ses propres données, sécurisé par RLS Supabase.

## Core Value

Un RH ivoirien doit pouvoir éditer un bulletin de paie 100 % conforme au droit CI, gérer l'ensemble du dossier salarié et obtenir une réponse juridique fiable — sans formation technique.

## Requirements

### Validated

- ✓ Gestion des employés (fiche complète : identité, contrat, primes, ancienneté) — existant
- ✓ Bulletins de paie au format SYSTECH avec calculs CI (CNPS 6,3%, ITS progressif, CMU, FDFP, AT/MP) — existant
- ✓ Prime ancienneté auto (CCI Art.17 : 1%/an, plafond 25%) — existant
- ✓ Prime 13e mois mensuelle auto (75% salaire / 12) — existant
- ✓ Éléments de salaire rattachés à l'employé (auto-remplissage bulletin) — existant
- ✓ Historique des éléments de salaire avec motif — existant
- ✓ Gestion des contrats (CDI, CDD, Stage, Apprentissage) — existant
- ✓ Bulletin modifiable en brouillon — existant
- ✓ Impression bulletin format SYSTECH — existant
- ✓ Notifications internes — existant
- ✓ Documents légaux / droit du travail CI — existant
- ✓ Agent RAG (base) — existant
- ✓ Multi-tenant avec RLS Supabase — existant
- ✓ Authentification Supabase Auth — existant

#### Phase 02 (Paie Avancée)

- ✓ Calcul des heures supplémentaires (décret CI n°96-203 : +15% à +75%)
- ✓ Calcul de solde de tout compte (indemnités légales à la rupture)
- ✓ Calcul de fin de contrat CDD (indemnité de précarité 3% si applicable)
- ✓ Masse salariale mensuelle — tableau de bord coûts salariaux
- ✓ Coût réel d'un salarié (salaire brut + toutes charges patronales)
- ✓ Export comptable / journal de paie
- ✓ Configuration conventions collectives (CCI, BTP, Commerce…)

#### Phase 03 (Congés & Absences)

- ✓ Solde congés légaux CI (2,5 j/mois travaillé)
- ✓ Workflow de validation (employé → manager → RH)
- ✓ Calendrier des absences
- ✓ Impact automatique sur le bulletin (retenue absence)
- ✓ Gestion des arrêts maladie et accident de travail

#### Phase 04 (Analytique RH & Reporting)

- ✓ Tableau de bord masse salariale mensuelle
- ✓ Suivi effectifs (entrées/sorties, pyramide des âges)
- ✓ Indicateurs RH clés (turnover, absentéisme, ancienneté moyenne)
- ✓ Export vers comptabilité

#### Phase 05 (Module Évaluations)

- ✓ Évaluation annuelle, semestrielle, trimestrielle, mensuelle
- ✓ Formulaire d'évaluation avec critères et notation paramétrables
- ✓ Historique des évaluations par employé, table SQL et interface
- ✓ Synthèse d'évaluation par intelligence artificielle (Gemini Flash)
- [ ] Alertes automatiques n8n avant échéance d'évaluation (à configurer côté n8n)

### Active

#### Module Disciplinaire

- [ ] Processus disciplinaire complet (demande d'explication → sanctions)
- [ ] Demande d'explication avec réponse employé
- [ ] Modèles de courriels : convocation licenciement, abandon de poste, faute lourde, démission, licenciement économique
- [ ] Suivi des procédures disciplinaires (statut, délais légaux CI)

#### Module Dossier Personnel

- [ ] Rangement et classement des documents du personnel
- [ ] Attestation de travail (génération automatique)
- [ ] Attestation de salaire
- [ ] Suivi de carrière (promotions, mutations, formations)
- [ ] Documents contractuels (avenants, renouvellements CDD)

#### Module QHSE / Sécurité

- [ ] Déclaration d'accident de travail
- [ ] Visite médicale (suivi, rappels, résultats)
- [ ] Registre QHSE
- [ ] Déclaration CNPS AT/MP

#### Module IA / RAG

- [ ] Questions droit du travail CI (Code du Travail, CCI, décrets)
- [ ] Rédaction de documents RH (lettres, mises en demeure, convocations)
- [ ] Analyse et explication de bulletins de paie
- [ ] Conseils RH personnalisés selon le contexte de l'entreprise

#### Module Communication

- [ ] Messagerie interne employé ↔ RH
- [ ] Notifications automatiques (bulletins disponibles, congés validés, évaluations)

### Out of Scope

- **Paie multi-pays** — Droit CI uniquement (conformité légale prioritaire)
- **Application mobile native** — Responsive web suffit pour v1
- **Intégration logiciels comptables tiers** — Export CSV/Excel suffit pour v1
- **Gestion de la formation professionnelle (FDFP)** — Déclaratif seulement, pas de suivi pédagogique
- **Self-service inscription PME** — Création de comptes manuelle pour v1 (pas encore décidé)

## Context

**Codebase existante :** MVP en cours avec ~22 routes API, 27 composants RH, 14 tables Supabase. Stack : Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + Supabase + n8n + Claude API.

**Dette technique connue :**

- `types/supabase.ts` désynchronisé (4 migrations non reflétées)
- Calcul de paie dupliqué 3× (POST, PATCH, print page) → à centraliser dans `lib/paie-ci.ts`
- Zéro test automatisé sur les calculs fiscaux
- Colonnes `companies` manquantes (adresse, NIF, N° CNPS, NCCM) → bulletin non conforme

**Droit applicable :** Code du Travail CI Loi n°2015-532, CCI AINSI-UGTCI, Décrets 2022/2025.
Paramètres 2026 : SMIG 75 000 FCFA, CNPS retraite 6,3% (plafond 1 647 315), CMU 1 600 FCFA, ITS barème progressif CGI Art.116.

**Multi-tenant :** Chaque table a `company_id UUID NOT NULL`. Toutes les requêtes filtrent via RLS avec `get_user_company_id()`.

**Conventions multiples :** CCI interprofessionnelle + BTP + Commerce + sectorielles. Architecture doit permettre des règles de calcul variables par convention.

## Constraints

- **Légal** : 100% conforme droit ivoirien 2025/2026 — les calculs de paie et procédures disciplinaires doivent respecter les textes en vigueur
- **Stack** : Next.js 14 + Supabase + shadcn/ui — pas de déviation sans validation
- **Multi-tenant** : RLS obligatoire sur chaque requête, jamais de bypass
- **Langue** : Interface 100% français, devise FCFA (XOF), dates DD/MM/YYYY Africa/Abidjan
- **TypeScript** : Interdit d'utiliser `any`, types stricts obligatoires
- **IA** : Claude API uniquement côté serveur (jamais depuis le client)

## Key Decisions

| Décision | Justification | Résultat |
| --- | --- | --- |
| Supabase RLS pour le multi-tenant | Sécurité au niveau base de données, pas applicatif | ✓ Validé |
| Format SYSTECH pour les bulletins | Standard reconnu en Côte d'Ivoire | ✓ Validé |
| Prime 13e mois = 75% salaire / 12 par mois | Prorata temporis mensuel | ✓ Validé |
| Transport non imposable (exclu base CNPS/ITS) | Droit CI — indemnité de transport exonérée | ✓ Validé |
| SMIG 75 000 FCFA base AT/MP et Famil+Mat | Décret n°2022-986 | ✓ Validé |
| Calcul ancienneté = date système (pas période bulletin) | Simplicité v1 | — Pending |
| Types Supabase manuels (pas de génération auto) | À corriger — types désynchronisés | ⚠️ Revisit |

## Evolution

Ce document évolue à chaque transition de phase et à chaque milestone.

### Mises à jour après chaque cycle

**Après chaque phase :**

1. Exigences invalidées ? → Déplacer dans Out of Scope avec raison
2. Exigences validées ? → Déplacer dans Validated avec référence de phase
3. Nouvelles exigences émergées ? → Ajouter dans Active
4. Décisions à logger ? → Ajouter dans Key Decisions
5. "What This Is" toujours exact ? → Mettre à jour si dérivé

### Révision de milestone

**Après chaque milestone :**

1. Revue complète de toutes les sections
2. Core Value check — toujours la bonne priorité ?
3. Audit Out of Scope — raisons toujours valides ?
4. Mettre à jour le Context avec l'état courant

---
---

Dernière mise à jour : 02 avril 2026 — validation Phase 05 (Module Évaluations)
