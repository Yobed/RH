# Requirements: FichePaie RH — SaaS RH Ivoirien

**Défini :** 30 mars 2026
**Valeur principale :** Éditer un bulletin conforme CI, gérer le dossier salarié complet, obtenir une réponse juridique fiable — sans formation technique.

---

## v1 Requirements

### Socle & Stabilisation (existant à corriger)

- [x] **SOC-01** : `types/supabase.ts` synchronisé avec les 4 migrations (primes, civilité, historique salaire, companies)
- [x] **SOC-02** : Calcul de paie centralisé dans `lib/paie-ci.ts` (fin de la duplication POST/PATCH/print)
- [x] **SOC-03** : Colonnes `companies` complètes (adresse, NIF, N° CNPS, NCCM, NCC) affichées dans le bulletin
- [x] **SOC-04** : Tests automatisés sur les fonctions de calcul fiscal (ITS, CNPS, ancienneté, 13e mois)

### Paie & Bulletins

- [x] **PAI-01** : Calcul des heures supplémentaires (décret CI n°96-203 : +15%/+50%/+75%)
- [ ] **PAI-02** : Calcul de solde de tout compte (préavis + indemnité licenciement + congés restants)
- [ ] **PAI-03** : Calcul de fin de contrat CDD (indemnité de précarité 3% si non renouvellement)
- [ ] **PAI-04** : Tableau masse salariale mensuelle (bruts, charges patronales, net total)
- [ ] **PAI-05** : Fiche coût réel d'un salarié (salaire brut + charges patronales détaillées)
- [ ] **PAI-06** : Export journal de paie (CSV/Excel pour comptable)
- [ ] **PAI-07** : Multi-convention collective (CCI, BTP, Commerce) avec règles de calcul variables

### Congés & Absences

- [x] **CON-01** : Solde congés légaux CI (2,5 j/mois travaillé, calcul automatique)
- [ ] **CON-02** : Saisie des absences et demandes de congés par l'employé
- [ ] **CON-03** : Workflow de validation congés (employé → manager → RH)
- [ ] **CON-04** : Calendrier des absences par équipe/département
- [ ] **CON-05** : Impact automatique sur le bulletin (retenue absence proportionnelle)
- [ ] **CON-06** : Gestion arrêt maladie et déclaration accident de travail

### Évaluations

- [ ] **EVA-01** : Évaluation de période d'essai avec date d'échéance calculée
- [ ] **EVA-02** : Évaluation annuelle, semestrielle et trimestrielle
- [ ] **EVA-03** : Formulaire d'évaluation configurable par type
- [ ] **EVA-04** : Historique des évaluations par employé
- [ ] **EVA-05** : Alertes automatiques avant échéance d'évaluation

### Processus Disciplinaire

- [ ] **DIS-01** : Demande d'explication avec réponse de l'employé
- [ ] **DIS-02** : Processus disciplinaire complet (demande → sanctions graduées)
- [ ] **DIS-03** : Modèles de courriels : convocation licenciement, abandon de poste, faute lourde, démission, licenciement économique
- [ ] **DIS-04** : Suivi des procédures disciplinaires avec statut et délais légaux CI

### Dossier Personnel

- [ ] **DOS-01** : Rangement et classement des documents du personnel (GED légère)
- [ ] **DOS-02** : Génération automatique d'attestation de travail
- [ ] **DOS-03** : Génération automatique d'attestation de salaire
- [ ] **DOS-04** : Suivi de carrière (promotions, mutations, formations, avenants)
- [ ] **DOS-05** : Gestion des renouvellements et avenants contractuels avec alertes

### QHSE & Sécurité au Travail

- [ ] **QHS-01** : Déclaration d'accident de travail (formulaire + suivi CNPS)
- [ ] **QHS-02** : Suivi des visites médicales (date, résultat, prochaine visite)
- [ ] **QHS-03** : Registre QHSE de l'entreprise
- [ ] **QHS-04** : Alertes visites médicales à renouveler

### Agent IA / RAG

- [ ] **RAG-01** : Réponse aux questions sur le droit du travail CI (Code du Travail, CCI, décrets)
- [ ] **RAG-02** : Rédaction de documents RH (lettres, convocations, mises en demeure)
- [ ] **RAG-03** : Analyse et explication d'un bulletin de paie
- [ ] **RAG-04** : Conseils RH personnalisés selon le contexte de l'entreprise
- [ ] **RAG-05** : Base documentaire à jour (LF 2026, SMIG, taux CNPS/ITS)

### Reporting & Tableaux de Bord

- [ ] **REP-01** : Tableau de bord masse salariale mensuelle (évolution, répartition)
- [ ] **REP-02** : Indicateurs RH clés (effectifs, turnover, absentéisme, ancienneté)
- [ ] **REP-03** : Pyramide des âges et répartition des contrats
- [ ] **REP-04** : Export des données RH (Excel/CSV)

### Communication Interne

- [ ] **COM-01** : Messagerie interne employé ↔ RH
- [ ] **COM-02** : Notifications automatiques (bulletin disponible, congés validés, évaluation)

---

## v2 Requirements

### Multi-tenant avancé

- **MT-01** : Self-service inscription PME (onboarding autonome)
- **MT-02** : Tableau de bord superadmin multi-entreprises

### Intégrations

- **INT-01** : Intégration logiciel comptable (Sage, etc.)
- **INT-02** : Portail employé (accès à ses bulletins, solde congés)
- **INT-03** : Application mobile

---

## Out of Scope

| Fonctionnalité | Raison |
|----------------|--------|
| Paie multi-pays | Droit CI uniquement pour v1 — conformité légale prioritaire |
| Application mobile native | Responsive web suffit pour v1 |
| Gestion formation professionnelle | Déclaratif FDFP seulement, pas de suivi pédagogique |
| Calcul CNPS vieillesse patronale | Taux variable par secteur — à confirmer CNPS CI |

---

## Traçabilité

| Requirement | Phase | Statut |
|-------------|-------|--------|
| SOC-01 à SOC-04 | Phase 1 | Pending |
| PAI-01 à PAI-07 | Phase 2 | Pending |
| CON-01 à CON-06 | Phase 3 | Pending |
| EVA-01 à EVA-05 | Phase 4 | Pending |
| DIS-01 à DIS-04 | Phase 4 | Pending |
| DOS-01 à DOS-05 | Phase 5 | Pending |
| QHS-01 à QHS-04 | Phase 5 | Pending |
| RAG-01 à RAG-05 | Phase 6 | Pending |
| REP-01 à REP-04 | Phase 7 | Pending |
| COM-01 à COM-02 | Phase 7 | Pending |

**Couverture :**
- Exigences v1 : 42 au total
- Mappées aux phases : 42
- Non mappées : 0 ✓

---
*Exigences définies : 30 mars 2026*
*Dernière mise à jour : 30 mars 2026 — initialisation*
