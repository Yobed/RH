# 03-CONTEXT.md — Phase 3 : Congés & Absences

## Objectif de la phase

Compléter et fiabiliser le module congés existant (MVP basique) pour couvrir l'intégralité du cycle légal ivoirien : calcul du solde légal CI (2,5 j/mois travaillé), workflow de validation multi-niveaux, calendrier des absences, impact automatique sur le bulletin de paie, et gestion des arrêts maladie / accidents de travail.

## Ce qui existe déjà

- Table `conges` avec colonnes : `id, company_id, employee_id, type, date_debut, date_fin, nb_jours, statut (demande|approuve|refuse), commentaire, created_at`
- Page `/conges` avec liste en attente + historique (Server Component)
- `CongesDialog` : formulaire de création (react-hook-form + zod)
- `CongesApprovalButton` : bouton approuver/refuser (1 clic = statut final, pas de workflow multi-niveaux)
- `GET /api/conges` + `POST /api/conges` + `PUT /api/conges/[id]` (statut basique)
- La page affiche "2,2 j/mois" — **erreur légale** : le droit CI (Art. 25 CT-CI) prévoit **2,5 j/mois** soit 30 jours/an

## Ce qui manque

1. **Table `leave_balances`** — solde légal par employé par année (jours acquis, pris, solde)
2. **Calcul automatique** du solde à l'embauche et chaque 1er du mois
3. **Workflow multi-niveaux** : `en_attente → validé_manager → validé_rh | refusé`
4. **Calendrier** `/conges/calendrier` — vue mensuelle par département
5. **`calculerRetenuAbsence`** dans `lib/paie-ci.ts` + liaison bulletin
6. **Arrêts maladie & AT** — formulaire de déclaration, justificatif, statut distinct, impact bulletin

## Contraintes légales CI (Art. 25 CT-CI 2015-532)

- Congé annuel légal : **2,5 j ouvrables par mois** = 30 j/an minimum
- Ancienneté 3-6 ans : +1 j ; 6-9 ans : +2 j ; 9-12 ans : +3 j ; 12-15 ans : +5 j ; +15 ans : +7 j
- Congé maternité : 14 semaines (Art. 23.6)
- Congé paternité : 10 jours
- Retenue absence injustifiée : proportionnelle au salaire journalier (salaire brut / 26 jours ouvrables)
- Arrêt maladie avec justificatif : maintien de salaire selon ancienneté (pas de retenue si AT reconnu CNPS)

## Décisions d'architecture

| Décision | Justification |
|---|---|
| Taux de base 2,5 j/mois (corriger l'erreur "2,2 j") | Art. 25 CT-CI 2015-532 |
| Calcul solde en base (table `leave_balances`) + trigger Supabase | Solde cohérent entre tous les modules |
| Workflow : colonne `statut` étendue à 4 valeurs + colonnes `validated_by_manager_at / validated_by_rh_at` | Traçabilité légale + audit |
| Calendrier : Server Component + filtre département côté client (useState) | Pas de complexité inutile, shadcn Calendar |
| Retenue absence : salaire_brut / 26 jours ouvrables × nb_jours | Standard cabinet comptable CI |
| Arrêt maladie : type `arret_maladie` dans `conges` + colonne `justificatif_url` + `est_justifie` | Réutilise la table existante |

## Structure des plans

| Plan | Périmètre | Wave | Requires |
|---|---|---|---|
| 03-01 | Migration SQL leave_balances + calcul solde légal CI + affichage fiche employé | 1 | — |
| 03-02 | Workflow validation multi-niveaux (statut étendu + API + composants) | 2 | 03-01 |
| 03-03 | Calendrier des absences `/conges/calendrier` | 2 | 03-01 |
| 03-04 | Impact bulletin : `calculerRetenuAbsence` + intégration PaieDialog | 2 | 03-01 |
| 03-05 | Arrêts maladie & AT — formulaire déclaration + justificatif + impact bulletin distinct | 3 | 03-02, 03-04 |
