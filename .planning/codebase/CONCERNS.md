# Problèmes et dette technique

**Date d'analyse :** 2026-03-30

---

## 1. Types TypeScript désynchronisés (CRITIQUE)

**`types/supabase.ts` est en retard de 4 migrations SQL.**

Les types générés automatiquement via Supabase CLI n'ont pas été re-générés après l'exécution manuelle des scripts dans `scripts/`. Conséquence : TypeScript ne connaît pas les nouvelles colonnes. Le code contourne ce problème avec des `as unknown as` et des types locaux manuels.

### Colonnes manquantes dans `employees` (Row/Insert/Update)

| Colonne | Script source | Présente dans types/supabase.ts |
|---------|--------------|-------------------------------|
| `sursalaire` | `scripts/add_employee_primes.sql` | Non |
| `prime_exceptionnelle` | `scripts/add_employee_primes.sql` | Non |
| `prime_salissure` | `scripts/add_employee_primes.sql` | Non |
| `prime_depassement` | `scripts/add_employee_primes.sql` | Non |
| `prime_fonction` | `scripts/add_employee_primes.sql` | Non |
| `prime_transport` | `scripts/add_employee_primes.sql` | Non |
| `civilite` | `scripts/add_employee_fields.sql` | Non |
| `nationalite` | `scripts/add_employee_fields.sql` | Non |
| `etat_civil` | `scripts/add_employee_fields.sql` | Non |
| `nb_enfants` | `scripts/add_employee_fields.sql` | Non |
| `niveau_etude` | `scripts/add_employee_fields.sql` | Non |
| `categorie` | `scripts/add_employee_fields.sql` | Non |
| `num_cnps` | `scripts/add_bulletin_primes.sql` | Non |

### Colonnes manquantes dans `bulletins_paie` (table absente du fichier)

La table `bulletins_paie` est entièrement absente de `types/supabase.ts`. Colonnes existantes en base : `sursalaire`, `prime_anciennete`, `prime_exceptionnelle`, `prime_salissure`, `prime_depassement`, `prime_fonction`, `prime_transport`.

### Table `employee_salary_history` absente des types

La table créée par `scripts/add_salary_history.sql` n'est pas dans `types/supabase.ts`. Tout accès à cette table nécessite le contournement `(supabase.from as (t: string) => ...)("employee_salary_history")` utilisé dans `app/api/employees/[id]/route.ts` et `app/(dashboard)/employes/[id]/page.tsx`.

### Colonnes manquantes dans `companies`

Le bulletin de paie imprimé (`app/(dashboard)/paie/[id]/print/page.tsx`) lit des colonnes `raison_sociale`, `adresse`, `cnps_matricule`, `nccm`, `ncc` via `as Record<string, string>`. Ces colonnes n'existent pas dans les types ni (probablement) en base. Résultat : toutes ces valeurs s'affichent `"—"` sur le bulletin.

**Correction :** Régénérer `types/supabase.ts` via `npx supabase gen types typescript --project-id <ref> > types/supabase.ts` après avoir vérifié que toutes les migrations sont appliquées en production.

---

## 2. Colonnes manquantes en base pour le bulletin de paie imprimé

**Fichier :** `app/(dashboard)/paie/[id]/print/page.tsx` (lignes 147–156)

Le bulletin imprimé lit `raison_sociale`, `adresse`, `cnps_matricule`, `nccm`, `ncc` sur la table `companies`. Ces colonnes ne sont pas définies dans les types et probablement absentes en base. Cela fait apparaître `"—"` dans l'en-tête et les numéros légaux du bulletin imprimé, ce qui rend le document non conforme.

- Impact : bulletins de paie imprimés sans nom d'entreprise structuré, sans numéro CNPS entreprise, sans numéro CCM.
- Fix : ajouter une migration SQL pour ces colonnes sur `companies`, puis mettre à jour `types/supabase.ts` et le formulaire `ParametresForm`.

---

## 3. Aucun test automatisé

**Portée :** tout le projet.

Il n'existe aucun fichier `*.test.ts`, `*.spec.ts`, aucun dossier `__tests__/`. Il n'y a pas de configuration Jest, Vitest, Playwright ou Cypress.

Zones à risque sans couverture :
- `lib/paie-ci.ts` : calculs fiscaux (`calculerITS`, `calculerBulletin`, `calculerChargesPatronales`, `calculerPrimeAnciennete`, `calculerIndemniteLicenciement`). Une erreur sur ces fonctions est silencieuse jusqu'au bulletin imprimé.
- Logique d'archivage du salaire dans `app/api/employees/[id]/route.ts` : la comparaison de champs salariaux avant/après mise à jour n'est pas testée.
- `calculerProvision13e` dans `lib/paie-ci.ts` : formule récemment modifiée (75%/12), zéro test de non-régression.

---

## 4. Dette technique : contournements TypeScript répandus

**38 occurrences** de `as unknown as` repérées dans 15 fichiers. Principal facteur : types désynchronisés (voir point 1). Les fichiers les plus touchés :

- `app/(dashboard)/paie/[id]/print/page.tsx` : 9 occurrences — accès aux champs primes et données entreprise non typés.
- `app/api/notifications/sync/route.ts` : 6 occurrences.
- `app/(dashboard)/employes/[id]/page.tsx` : 2 occurrences — lecture des champs `civilite`, `nationalite`, etc.
- `app/api/employees/[id]/route.ts` : 1 occurrence — accès à `employee_salary_history` via cast de la fonction `from`.

Ces contournements masquent des erreurs potentielles au moment de la compilation. Ils disparaîtront dès que `types/supabase.ts` sera régénéré.

---

## 5. Fonctionnalité incomplète : données entreprise sur le bulletin

**Fichiers :** `app/(dashboard)/paie/[id]/print/page.tsx`, `components/rh/ParametresForm.tsx`, `app/api/entreprise/route.ts`

Le bulletin imprimé a besoin de : nom légal (`raison_sociale`), adresse, numéro CNPS entreprise (`cnps_matricule`), numéro CCM (`nccm`), numéro CC (`ncc`). Ces champs sont lus mais n'existent pas encore dans la table `companies` ni dans le formulaire Paramètres.

Le formulaire `ParametresForm` gère uniquement `name` et `convention_collective`. Les champs légaux pour le bulletin ne sont donc pas saisissables dans l'interface.

---

## 6. Limite de pagination sur les candidatures

**Fichier :** `app/(dashboard)/recrutement/page.tsx` (ligne 37)

Les candidatures sont limitées à `.limit(10)`. Il n'y a pas de pagination UI. Si l'entreprise gère plus de 10 candidats actifs, les anciennes entrées sont invisibles.

---

## 7. Limite de pagination sur les documents archivés

**Fichier :** `app/(dashboard)/archives/page.tsx` (ligne 35)

Les documents sont limités à `.limit(20)`. Pas de pagination. Les documents plus anciens sont inaccessibles depuis l'interface.

---

## 8. Sécurité : `audit_logs` non utilisé dans le code applicatif

**Fichier :** `scripts/migration_securite.sql`

La table `audit_logs` est créée et sécurisée en RLS. Mais aucune route API ne l'alimente (`INSERT`). Les opérations critiques (création/modification d'employé, génération de bulletin, modification de statut de congé) ne sont pas tracées. La table est vide en production.

- Impact : impossibilité de pister qui a modifié quoi, problème de conformité pour un SaaS RH multi-tenant.
- Fix : ajouter des appels `INSERT` dans `app/api/employees/route.ts`, `app/api/paie/route.ts`, `app/api/conges/[id]/route.ts` après chaque opération critique.

---

## 9. Sécurité : `PUT /api/paie/[id]` sans vérification multi-tenant

**Fichier :** `app/api/paie/[id]/route.ts` (lignes 23–44)

Le handler `PUT` (changement de statut) vérifie l'authentification mais ne filtre pas par `company_id` lors de la mise à jour. Il utilise uniquement `.eq("id", params.id)`. La RLS Supabase protège normalement cette requête, mais si la RLS est mal configurée ou temporairement désactivée, un utilisateur pourrait modifier le statut d'un bulletin appartenant à une autre entreprise.

Le handler `PATCH` (modification du bulletin) est correct : il filtre `.eq("company_id", existing.company_id)`.

- Fix : ajouter `.eq("company_id", companyId)` dans le `PUT` comme dans le `PATCH`.

---

## 10. Sécurité : documents juridiques partagés entre tous les tenants sans contrôle d'écriture fort

**Fichier :** `app/api/rag/upload/route.ts` (ligne 111)

Les documents uploadés sont insérés avec `company_id: null`, ce qui les rend visibles à tous les tenants authentifiés. N'importe quel utilisateur connecté peut uploader un document dans le corpus juridique partagé (pas de vérification du rôle `admin`). Un utilisateur malveillant pourrait empoisonner la base RAG avec de faux textes législatifs.

- Fix : vérifier que `profile.role === "admin"` avant d'autoriser l'upload RAG.

---

## 11. `require()` CommonJS dans un projet ESM

**Fichier :** `app/api/rag/upload/route.ts` (ligne 3)

```ts
const pdfParse = require("pdf-parse") as ...
```

Un `require()` est utilisé pour `pdf-parse` car ce module n'a pas d'export ESM natif. Cela fonctionne grâce à `export const runtime = "nodejs"` (ligne 5), mais c'est une exception fragile. Des mises à jour de Next.js ou de la config de bundling pourraient casser ce point.

- Fix : utiliser `pdf-parse` via un import dynamique `await import("pdf-parse")` ou le remplacer par une librairie compatible ESM comme `pdfjs-dist`.

---

## 12. Valeurs fiscales codées en dur sans mécanisme de mise à jour

**Fichier :** `lib/paie-ci.ts`

Les taux fiscaux et seuils suivants sont des constantes codées :

| Constante | Valeur | Source |
|-----------|--------|--------|
| `SMIG_MENSUEL` | 75 000 FCFA | Décret 2022-986 |
| `TAUX_CNPS_RETRAITE_SALARIE` | 6,3% | CNPS CI |
| `PLAFOND_CNPS_MENSUEL` | 1 647 315 FCFA | CNPS CI |
| `CMU_MENSUEL` | 1 600 FCFA | CNAM |
| Barème ITS | 5 tranches | CGI CI Art. 116 |
| Abattement ITS | 15% | CGI CI Art. 116 |

Ces valeurs sont susceptibles d'évoluer chaque année (Loi de Finances). Le fichier lui-même note `⚠️ VÉRIFICATION ANNUELLE OBLIGATOIRE`. Il n'existe aucun mécanisme (table de paramétrage, variable d'environnement) pour les modifier sans redéploiement.

- Impact : bulletin de paie incorrect si les taux changent et que le code n'est pas mis à jour.
- Fix : déplacer ces paramètres dans une table `fiscal_params` en base ou dans des variables d'environnement avec valeur par défaut, pour permettre la mise à jour sans redéploiement.

---

## 13. Calcul d'ancienneté dupliqué

**Fichiers :** `app/(dashboard)/employes/[id]/page.tsx` (ligne 39), `app/(dashboard)/paie/[id]/print/page.tsx` (ligne 53)

La fonction `formatAnciennete(dateEmbauche: string)` est définie deux fois, de façon identique. Elle devrait être exportée depuis `lib/paie-ci.ts` ou un utilitaire partagé.

---

## 14. Calcul de paie dupliqué (frontend + backend)

**Fichiers :** `components/rh/PaieDialog.tsx` (fonction `previewCalc`, lignes 86–115), `app/api/paie/route.ts`, `app/api/paie/[id]/route.ts`

La logique de calcul du net à payer (CNPS, abattement, ITS, transport non imposable) est réimplémentée trois fois. Si un taux change dans `lib/paie-ci.ts`, il faut aussi mettre à jour manuellement la preview frontend dans `PaieDialog.tsx`.

- Fix : la preview peut appeler directement `calculerBulletin()` importé depuis `lib/paie-ci.ts` (ce qui est partiellement fait pour `calculerITS`, mais pas pour le calcul complet).

---

## 15. Fichiers de gestion des migrations hors suivi formel

Toutes les migrations sont des scripts SQL manuels dans `scripts/` à exécuter dans l'éditeur SQL Supabase. Il n'y a pas de dossier `supabase/migrations/` avec versionnement automatique via `supabase db push`.

Scripts présents dans `scripts/` (à appliquer dans l'ordre) :
1. `migration_securite.sql`
2. `add_employee_fields.sql`
3. `add_employee_primes.sql`
4. `add_bulletin_primes.sql`
5. `add_salary_history.sql`

- Risque : impossible de savoir quelles migrations ont été appliquées en production. Pas d'état `supabase/migrations/` versionné. En cas d'environnement staging ou second projet Supabase, toutes les migrations devraient être rejouées manuellement.
- Fix : migrer vers `supabase/migrations/` avec nommage `YYYYMMDDHHMMSS_description.sql` et utiliser `supabase db push`.

---

## 16. Fonctionnalité manquante : solde de congés

**Fichiers :** `app/(dashboard)/conges/page.tsx`, `app/api/conges/route.ts`

Le module congés stocke les demandes et permet l'approbation. Il n'y a pas de calcul de solde de congés payés (2,2 jours/mois selon Art. 25 CT-CI). L'interface ne montre pas combien de jours un employé a acquis vs consommés. Le calcul cumulé affiché sur le bulletin imprimé (colonnes "Congés pris / à Prendre") est toujours vide.

---

## 17. Fonctionnalité manquante : module formation

**Fichier :** aucun

La sidebar (`components/rh/SidebarNav.tsx`) ne liste pas de module formation. Le champ `niveau_etude` est capturé sur l'employé, mais il n'y a pas de suivi des formations, des plans de formation ou des obligations FDFP (pourtant calculées dans `lib/paie-ci.ts` comme charges patronales).

---

## 18. `scoreLabel` et `scoreVariant` dupliqués

**Fichiers :** `app/(dashboard)/employes/[id]/page.tsx` (ligne 62), `app/(dashboard)/evaluations/page.tsx` (lignes 10–23)

Les fonctions `scoreLabel` et `scoreVariant` sont définies deux fois. Elles devraient être extraites dans un utilitaire partagé.

---

## 19. Mode de paiement codé en dur sur le bulletin

**Fichier :** `app/(dashboard)/paie/[id]/print/page.tsx` (ligne 641)

```tsx
Mode de paie : <span className="font-semibold">Virement</span>
```

Le mode de paiement est fixé à "Virement" en dur, sans lire une valeur de la base. Si un employé est payé en espèces ou par chèque, le bulletin imprimé sera inexact.

---

## 20. Champ `date_fin_contrat` non persisté sur l'employé existant (mode édition)

**Fichier :** `components/rh/EmployeeDialog.tsx` (ligne 122)

En mode édition, `date_fin_contrat` est initialisé à `""` (chaîne vide) et non à la valeur existante. Si un RH modifie un autre champ d'un employé en CDD, le champ `date_fin_contrat` sera envoyé comme `null` via `cleanPayload`, effaçant potentiellement la date de fin existante.

---

*Audit de la dette technique : 2026-03-30*
