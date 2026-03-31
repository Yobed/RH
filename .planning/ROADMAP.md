# Roadmap: FichePaie RH

**Milestone:** v1.0 — SaaS RH Ivoirien Complet
**Started:** 30 mars 2026
**Target:** T3 2026 (estimé ~20 semaines)
**Granularity:** Standard (5-8 phases)
**Coverage:** 42/42 exigences v1 mappées

---

## Phases

- [x] **Phase 1: Stabilisation** — Corriger la dette technique critique avant d'ajouter des fonctionnalités
- [ ] **Phase 2: Paie Avancée** — Compléter le moteur de paie CI (heures sup, fins de contrat, masse salariale, export)
- [ ] **Phase 3: Congés & Absences** — Module congés complet avec solde légal CI et impact sur le bulletin
- [ ] **Phase 4: Dossier Personnel & Cycle Contractuel** — GED légère, attestations automatiques, suivi carrière, alertes avenants
- [ ] **Phase 5: Évaluations & Discipline** — Évaluations configurables et processus disciplinaire complet conforme CT-CI
- [ ] **Phase 6: QHSE & Sécurité au Travail** — Déclarations AT, visites médicales, registre QHSE
- [ ] **Phase 7: Agent IA & Reporting** — RAG droit du travail CI, tableaux de bord analytiques, communication interne

---

## Phase Details

### Phase 1: Stabilisation
**Goal:** La base de code est fiable — types TypeScript synchronisés, calcul de paie centralisé sans duplication, données entreprise complètes sur le bulletin, tests de non-régression sur les fonctions fiscales.
**Depends on:** Rien (priorité absolue avant tout développement)
**Covers:** SOC-01, SOC-02, SOC-03, SOC-04
**Plans:** 5 plans
Plans:
- [x] 01-01-PLAN.md — Régénérer types/supabase.ts + supprimer les 38 as unknown as
- [x] 01-02-PLAN.md — Migration SQL companies + formulaire Paramètres + bulletin imprimé conforme
- [x] 01-03-PLAN.md — Centraliser calcul paie dans lib/paie-ci.ts + corriger PUT + EmployeeDialog
- [x] 01-04-PLAN.md — Configurer Vitest + suite de tests des 7 fonctions fiscales LF 2026
- [x] 01-05-PLAN.md — Sécurité POST /api/rag/upload + audit_logs + migrations versionnées

**Success Criteria** (what must be TRUE):
1. Le bulletin imprimé affiche le nom légal, l'adresse, le numéro CNPS et les numéros CCM/NCC de l'entreprise sans aucun "—"
2. TypeScript compile sans `as unknown as` — zéro occurrence dans les 15 fichiers concernés
3. La suite de tests Vitest passe à 100% sur toutes les fonctions de `lib/paie-ci.ts`, y compris les taux LF 2026
4. Un changement de taux dans `lib/paie-ci.ts` se répercute immédiatement dans la preview `PaieDialog` sans autre modification
5. Tout upload dans la base RAG échoue avec 403 si l'utilisateur n'a pas le rôle `admin`
**UI hint**: yes

---

### Phase 2: Paie Avancée
**Goal:** Les RH peuvent calculer les heures supplémentaires, les soldes de fin de contrat (CDI et CDD), produire la masse salariale mensuelle et exporter le journal de paie pour le comptable — tout en respectant les décrets CI en vigueur.
**Depends on:** Phase 1
**Covers:** PAI-01, PAI-02, PAI-03, PAI-04, PAI-05, PAI-06, PAI-07
**Plans:**
5/5 plans executed
- [x] 02-01: Heures supplémentaires CI — calculerHeuresSup (3 paliers +15%/+50%/+75%), PaieDialog UI, POST + PATCH API
- [x] 02-02: Fins de contrat — ajouter `calculerSoldeDeCompte(employee)` (préavis + indemnité + congés restants) et `calculerIndemnitePrécarité(salaireBrut)` (3% CDD non renouvelé) dans `lib/paie-ci.ts` ; page dédiée `/paie/fin-de-contrat`
- [x] 02-03: Masse salariale mensuelle — page `/paie/masse-salariale` avec tableau bruts + charges patronales + net total par période ; fiche coût réel salarié (brut + charges patronales détaillées) accessible depuis la fiche employé
- [x] 02-04: Export journal de paie — endpoint `GET /api/paie/export?periode=YYYY-MM` retournant CSV/Excel pour le comptable ; bouton export sur la page `/paie`
- [x] 02-05: Multi-convention collective — table `fiscal_params` en base pour paramétrer les règles variables par convention (CCI, BTP, Commerce) ; `ParametresForm` permet de sélectionner la convention et visualiser les taux appliqués

**Success Criteria** (what must be TRUE):
1. Un RH peut saisir les heures supplémentaires d'un employé et voir le montant calculé selon les trois majorations CI directement dans la preview du bulletin
2. Le système calcule et affiche le solde de tout compte complet (préavis + indemnité de licenciement + congés non pris) pour un CDI dont la date de fin est renseignée
3. La page masse salariale affiche le total bruts, charges patronales et net pour le mois en cours avec les données de tous les employés actifs
4. Le fichier CSV/Excel exporté est importable directement dans un logiciel comptable (colonnes : matricule, nom, brut, CNPS, ITS, CMU, charges patronales, net)
5. Changer la convention collective dans les paramètres modifie les règles de calcul appliquées aux nouveaux bulletins
**Plans:** 5 plans

**UI hint**: yes

---

### Phase 3: Congés & Absences
**Goal:** Les employés peuvent demander des congés, les managers les valider, et le bulletin de paie reflète automatiquement les absences et le solde légal CI (2,5 j/mois travaillé).
**Depends on:** Phase 1
**Covers:** CON-01, CON-02, CON-03, CON-04, CON-05, CON-06
**Plans:** 5 plans
Plans:
- [x] 03-01-PLAN.md — Table leave_balances + lib/conges-ci.ts (calculerJoursAcquis 2,5j/mois) + widget solde fiche employé
- [ ] 03-02-PLAN.md — Workflow multi-niveaux (en_attente → valide_manager → approuve|refuse) + CongesApprovalButton + colonnes audit
- [ ] 03-03-PLAN.md — Page /conges/calendrier — grille mensuelle par employé avec filtre département
- [ ] 03-04-PLAN.md — calculerRetenuAbsence dans lib/paie-ci.ts + champ absence PaieDialog + preview retenue
- [ ] 03-05-PLAN.md — ArretMaladieDialog avec upload justificatif + colonnes est_justifie/est_at + badges liste congés

**Success Criteria** (what must be TRUE):
1. La fiche d'un employé embauché il y a 6 mois affiche 15 jours de congés acquis (6 × 2,5 j) et le solde restant après ses prises
2. Une demande de congé soumise par l'employé apparaît chez le manager pour validation avant d'atteindre le statut RH — l'employé reçoit une notification à chaque changement de statut
3. Le calendrier affiche en couleur les absences de tous les membres d'un département pour le mois sélectionné
4. Un bulletin généré pour un employé ayant 3 jours d'absence non justifiée affiche une retenue proportionnelle calculée correctement
5. Une déclaration d'arrêt maladie ne génère pas de retenue salariale si le document justificatif est joint et validé
**UI hint**: yes

---

### Phase 4: Dossier Personnel & Cycle Contractuel
**Goal:** Le dossier RH complet d'un salarié est consultable en un seul endroit — documents classés, attestations générées en un clic, historique de carrière traçable, alertes sur les échéances contractuelles.
**Depends on:** Phase 1
**Covers:** DOS-01, DOS-02, DOS-03, DOS-04, DOS-05
**Plans:**
- [ ] 04-01: GED légère — étendre le module `/archives` existant avec classification par famille (contrat, avenant, bulletin, attestation, disciplinaire, médical, autre) ; pagination complète (remplacer `.limit(20)` par pagination UI) ; recherche par nom de document
- [ ] 04-02: Génération automatique d'attestations — endpoint `POST /api/documents/attestation` générant un PDF (attestation de travail, attestation de salaire) avec les données de l'employé et l'en-tête de l'entreprise ; téléchargement direct depuis la fiche employé
- [ ] 04-03: Suivi de carrière — migration SQL : table `career_events` (company_id, employee_id, type [promotion/mutation/formation/avenant], date, description, salaire_avant, salaire_apres) ; affichage timeline sur la fiche employé
- [ ] 04-04: Gestion des avenants et alertes contractuelles — formulaire de renouvellement/avenant dans `ContractDialog` ; notifications automatiques 30/15/7 jours avant expiration CDD ou fin période d'essai ; sync dans `POST /api/notifications/sync`

**Success Criteria** (what must be TRUE):
1. Tous les documents d'un employé sont accessibles depuis sa fiche, filtrables par famille, sans limite de nombre affiché
2. Un RH peut générer et télécharger une attestation de travail ou de salaire en moins de 10 secondes depuis la fiche employé, avec le nom légal et les numéros CNPS/NCC de l'entreprise pré-remplis
3. La fiche employé affiche la chronologie des promotions, mutations et avenants avec les dates et variations de salaire
4. Une notification apparaît automatiquement 30 jours avant la fin d'un CDD et disparaît une fois l'avenant ou la conversion CDI enregistrés
**Plans:** TBD
**UI hint**: yes

---

### Phase 5: Évaluations & Discipline
**Goal:** Les managers peuvent conduire des évaluations structurées à toutes les périodicités RH CI, et les RH peuvent gérer un processus disciplinaire complet avec les courriers réglementaires — sans connaître le Code du Travail par cœur.
**Depends on:** Phase 1
**Covers:** EVA-01, EVA-02, EVA-03, EVA-04, EVA-05, DIS-01, DIS-02, DIS-03, DIS-04
**Plans:**
- [ ] 05-01: Évaluations configurables — migration SQL : table `evaluation_templates` (company_id, type, critères JSON, périodicité) ; `EvaluationDialog` étendu pour sélectionner un modèle ; calcul automatique de la date d'échéance selon la périodicité
- [ ] 05-02: Évaluation période d'essai et historique — calcul automatique de la date d'échéance (date_embauche + durée légale selon type_contrat CI) ; vue historique complète sur la fiche employé ; alertes automatiques 7 jours avant échéance (sync `notifications/sync`)
- [ ] 05-03: Processus disciplinaire complet — migration SQL : table `disciplinary_cases` (company_id, employee_id, type_sanction, statut, délais_légaux) ; formulaire demande d'explication avec zone de réponse employé ; workflow graduated (avertissement → mise en demeure → licenciement)
- [ ] 05-04: Modèles de courriers disciplinaires — générateur PDF pour convocation licenciement, abandon de poste, faute lourde, démission acceptée, licenciement économique ; variables auto-remplies depuis le dossier employé ; accessibles depuis le dossier disciplinaire

**Success Criteria** (what must be TRUE):
1. Un manager peut lancer une évaluation en sélectionnant un modèle configuré par le RH — les critères, pondérations et date d'échéance s'initialisent automatiquement
2. Un employé en CDI voit sa date d'échéance de période d'essai calculée automatiquement à l'embauche et une alerte apparaît 7 jours avant
3. Un dossier disciplinaire trace chaque étape (demande d'explication envoyée, réponse reçue, décision, délai légal restant) avec les dates exactes
4. Un courrier de convocation à entretien préalable de licenciement est généré en PDF avec le nom, le poste et les dates légales CI pré-remplis en moins de 30 secondes
**Plans:** TBD
**UI hint**: yes

---

### Phase 6: QHSE & Sécurité au Travail
**Goal:** L'entreprise peut déclarer et suivre les accidents du travail (CNPS CI), planifier les visites médicales obligatoires et maintenir un registre QHSE conforme — avec alertes automatiques avant les échéances.
**Depends on:** Phase 3 (arrêt maladie/AT introduit en CON-06)
**Covers:** QHS-01, QHS-02, QHS-03, QHS-04
**Plans:**
- [ ] 06-01: Déclaration accident de travail — migration SQL : table `work_accidents` (company_id, employee_id, date, description, gravité, statut_cnps, pièces_jointes) ; formulaire conforme aux rubriques CNPS CI ; liaison automatique avec un arrêt maladie si existant
- [ ] 06-02: Suivi des visites médicales — migration SQL : table `medical_visits` (company_id, employee_id, date_visite, résultat, médecin, prochaine_visite) ; vue liste par employé et par date ; alertes automatiques 30 jours avant la prochaine visite obligatoire
- [ ] 06-03: Registre QHSE — page `/qhse` agrégeant accidents déclarés, visites médicales en retard, indicateurs de sinistralité (taux de fréquence, taux de gravité) ; export CSV du registre

**Success Criteria** (what must be TRUE):
1. Un RH peut déclarer un accident de travail en renseignant le formulaire structuré et télécharger le récapitulatif pour la CNPS CI
2. La liste des visites médicales indique clairement les employés dont la visite est en retard ou à planifier dans les 30 prochains jours
3. Le registre QHSE affiche les indicateurs de sinistralité de l'année en cours et peut être exporté en CSV
**Plans:** TBD
**UI hint**: yes

---

### Phase 7: Agent IA & Reporting
**Goal:** Les RH obtiennent des réponses juridiques fiables sur le droit du travail CI, peuvent rédiger des documents RH assistés par IA, et disposent de tableaux de bord analytiques complets avec export — le tout accessible depuis une interface unifiée.
**Depends on:** Phase 1, Phase 2, Phase 3 (données nécessaires aux indicateurs)
**Covers:** RAG-01, RAG-02, RAG-03, RAG-04, RAG-05, REP-01, REP-02, REP-03, REP-04, COM-01, COM-02
**Plans:**
- [ ] 07-01: Base documentaire RAG à jour LF 2026 — upload et indexation des textes LF 2026, décrets SMIG, taux CNPS/ITS à jour dans `legal_documents` (via `POST /api/rag/upload` sécurisé admin) ; validation de la couverture dans le chat juridique
- [ ] 07-02: Agent IA enrichi — étendre `questionnerAssistantRH` pour la rédaction de documents RH (lettres, convocations, mises en demeure) et l'analyse/explication d'un bulletin de paie fourni ; interface chat mise à jour avec suggestions de prompts contextuels
- [ ] 07-03: Tableaux de bord analytiques — page `/reporting` avec masse salariale mensuelle (évolution 12 mois), indicateurs RH clés (effectifs, turnover, absentéisme, ancienneté moyenne), pyramide des âges, répartition des types de contrats
- [ ] 07-04: Export données RH + communication interne — endpoint `GET /api/reporting/export` (Excel/CSV multi-onglets) ; table `messages` pour la messagerie interne employé ↔ RH ; notifications automatiques bulletin disponible / congés validés / évaluation à compléter

**Success Criteria** (what must be TRUE):
1. Une question sur le taux CNPS 2026 ou le SMIG en vigueur retourne la valeur correcte avec citation de la source légale (LF 2026 ou décret)
2. Le chat IA génère un courrier de mise en demeure pour abandon de poste structuré et personnalisé avec les données de l'employé en moins de 15 secondes
3. Le tableau de bord reporting affiche l'évolution mensuelle de la masse salariale sur 12 mois et les 5 indicateurs RH clés sans délai de chargement perceptible
4. L'export Excel contient au minimum 4 onglets (effectifs, bulletins, congés, indicateurs) et s'ouvre correctement dans Excel/LibreOffice
5. Un employé reçoit une notification automatique dans l'interface lorsque son bulletin du mois est disponible
**Plans:** TBD
**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Stabilisation | 5/5 | Completed | - |
| 2. Paie Avancée | 2/5 | In Progress|  |
| 3. Congés & Absences | 0/5 | Planned | - |
| 4. Dossier Personnel & Cycle Contractuel | 0/4 | Not started | - |
| 5. Evaluations & Discipline | 0/4 | Not started | - |
| 6. QHSE & Sécurité au Travail | 0/3 | Not started | - |
| 7. Agent IA & Reporting | 0/4 | Not started | - |

---

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| SOC-01 | Phase 1 | Planned |
| SOC-02 | Phase 1 | Planned |
| SOC-03 | Phase 1 | Planned |
| SOC-04 | Phase 1 | Planned |
| PAI-01 | Phase 2 | Pending |
| PAI-02 | Phase 2 | Pending |
| PAI-03 | Phase 2 | Pending |
| PAI-04 | Phase 2 | Pending |
| PAI-05 | Phase 2 | Pending |
| PAI-06 | Phase 2 | Pending |
| PAI-07 | Phase 2 | Pending |
| CON-01 | Phase 3 | Pending |
| CON-02 | Phase 3 | Pending |
| CON-03 | Phase 3 | Pending |
| CON-04 | Phase 3 | Pending |
| CON-05 | Phase 3 | Pending |
| CON-06 | Phase 3 | Pending |
| DOS-01 | Phase 4 | Pending |
| DOS-02 | Phase 4 | Pending |
| DOS-03 | Phase 4 | Pending |
| DOS-04 | Phase 4 | Pending |
| DOS-05 | Phase 4 | Pending |
| EVA-01 | Phase 5 | Pending |
| EVA-02 | Phase 5 | Pending |
| EVA-03 | Phase 5 | Pending |
| EVA-04 | Phase 5 | Pending |
| EVA-05 | Phase 5 | Pending |
| DIS-01 | Phase 5 | Pending |
| DIS-02 | Phase 5 | Pending |
| DIS-03 | Phase 5 | Pending |
| DIS-04 | Phase 5 | Pending |
| QHS-01 | Phase 6 | Pending |
| QHS-02 | Phase 6 | Pending |
| QHS-03 | Phase 6 | Pending |
| QHS-04 | Phase 6 | Pending |
| RAG-01 | Phase 7 | Pending |
| RAG-02 | Phase 7 | Pending |
| RAG-03 | Phase 7 | Pending |
| RAG-04 | Phase 7 | Pending |
| RAG-05 | Phase 7 | Pending |
| REP-01 | Phase 7 | Pending |
| REP-02 | Phase 7 | Pending |
| REP-03 | Phase 7 | Pending |
| REP-04 | Phase 7 | Pending |
| COM-01 | Phase 7 | Pending |
| COM-02 | Phase 7 | Pending |

**Total v1 mappées : 47/47** *(42 exigences originales + 5 issues de dette CONCERNS.md absorbées dans SOC-01 à SOC-04 et Phase 1)*

---

*Roadmap créée : 30 mars 2026*
*Phase 1 planifiée : 30 mars 2026 — 5 plans créés (01-01 à 01-05)*
*Phase 3 planifiée : 31 mars 2026 — 5 plans créés (03-01 à 03-05)*
