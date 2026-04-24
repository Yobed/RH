# Phase 1: Stabilisation - Research

**Researched:** 2026-03-30
**Domain:** TypeScript types sync, paie centralisation, Vitest, Supabase migrations, sécurité API
**Confidence:** HIGH

---

## Project Constraints (from CLAUDE.md)

- Stack obligatoire : Next.js 14 App Router + TypeScript + Supabase + shadcn/ui. Ne pas dévier sans approbation.
- Multi-tenant absolu : `company_id` sur chaque table, RLS active sur chaque requête.
- Jamais de `any` en TypeScript.
- Jamais d'appel à Claude API depuis le client.
- Interface en Français, devise FCFA, dates DD/MM/YYYY timezone Africa/Abidjan.
- ORM : client Supabase uniquement (pas de Prisma).
- Lire les SKILL.md avant chaque domaine (architecture, database, modules, security).

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SOC-01 | `types/supabase.ts` synchronisé avec les 4 migrations (primes, civilité, historique salaire, companies) | Plan 01-01 : régénération via Supabase CLI |
| SOC-02 | Calcul de paie centralisé dans `lib/paie-ci.ts` (fin de la duplication POST/PATCH/print) | Plan 01-03 : supprimer `previewCalc`, unifier dans `calculerBulletin` |
| SOC-03 | Colonnes `companies` complètes (adresse, NIF, N° CNPS, NCCM, NCC) affichées dans le bulletin | Plan 01-02 : migration SQL + `ParametresForm` + route API |
| SOC-04 | Tests automatisés sur les fonctions de calcul fiscal (ITS, CNPS, ancienneté, 13e mois) | Plan 01-04 : Vitest configuré, suite complète |
</phase_requirements>

---

## Summary

Cette phase est une stabilisation brownfield : zéro nouvelle fonctionnalité, 100% correction de dette technique. Le codebase existant tourne en production mais avec 19 occurrences de `as unknown as` dans le code applicatif (hors node_modules), `types/supabase.ts` désynchronisé de 4 migrations SQL appliquées manuellement, la logique de calcul de paie dupliquée dans `PaieDialog.tsx`/`PATCH /api/paie/[id]`/`POST /api/paie`, des colonnes `companies` inexistantes en base ce qui produit un bulletin non conforme (champs `"—"`), et zéro test automatisé sur les calculs fiscaux critiques.

La régénération des types Supabase débloque automatiquement la majorité des `as unknown as` : les tables `bulletins_paie` (absente des types), `employee_salary_history` (absente), et les colonnes de primes sur `employees` ne sont pas dans les types actuels. La migration `companies` est la seule à écrire from scratch — les 4 autres migrations existent déjà dans `scripts/` et doivent être appliquées en production puis les types régénérés.

La sécurité de `POST /api/rag/upload` est un risque avéré : n'importe quel utilisateur authentifié peut empoisonner le corpus RAG partagé. Le pattern de vérification de rôle existe déjà dans le projet (`profiles.role`), il suffit de l'appliquer. La migration vers `supabase/migrations/` est du travail organisationnel pur : renommer et déplacer les scripts `scripts/*.sql` avec convention de nommage `YYYYMMDDHHMMSS_description.sql`.

**Recommandation principale :** Exécuter les plans dans l'ordre 01-01 → 01-02 → 01-03 → 01-04 → 01-05 car la régénération des types (01-01) est un prérequis à tout le reste — elle supprime les contournements qui masquent les erreurs de compilation.

---

## Standard Stack

### Core (déjà installé dans le projet)

| Library | Version actuelle | Purpose | Statut |
|---------|-----------------|---------|--------|
| vitest | 4.1.2 (registry) | Framework de tests unitaires | A installer |
| @vitest/coverage-v8 | 4.1.2 (registry) | Couverture de code V8 | A installer |
| supabase CLI | 2.84.5 (npx) | Génération des types TypeScript | Disponible via npx |
| TypeScript | ^5.9.3 | Typage strict | Installé |
| Next.js | ^14.2.35 | Framework fullstack | Installé |

**Verification npm registry (2026-03-30) :** vitest 4.1.2 et @vitest/coverage-v8 4.1.2 sont les versions courantes.

### Installation requise pour 01-04

```bash
npm install --save-dev vitest @vitest/coverage-v8
```

### Alternatives considérées

| Standard retenu | Alternative | Raison du choix |
|----------------|-------------|-----------------|
| Vitest | Jest | Vitest est natif ESM, compatible avec le module system de Next.js 14 sans config babel supplémentaire. Playwright est déjà en devDep pour E2E — Vitest couvre les tests unitaires. |
| `npx supabase gen types` | Supabase Dashboard export | CLI produit le fichier exact attendu par `@supabase/supabase-js`, pas de formatage manuel. |

---

## Architecture Patterns

### Pattern 01-01 : Régénération des types Supabase

**Contexte :** Supabase CLI est disponible via `npx supabase` (v2.84.5, confirmé localement). Il n'est pas installé globalement mais `npx` fonctionne.

**Commande de régénération :**

```bash
npx supabase gen types typescript \
  --project-id <SUPABASE_PROJECT_REF> \
  > types/supabase.ts
```

Le `SUPABASE_PROJECT_REF` est l'identifiant de 20 caractères visible dans l'URL Supabase Dashboard : `https://supabase.com/dashboard/project/<REF>`. Il est aussi dans les variables d'environnement : `NEXT_PUBLIC_SUPABASE_URL` contient `https://<REF>.supabase.co`.

**Prérequis :** Les 5 scripts `scripts/*.sql` doivent être appliqués en production avant la régénération (dans l'ordre : `migration_securite.sql` → `add_employee_fields.sql` → `add_bulletin_primes.sql` → `add_employee_primes.sql` → `add_salary_history.sql`). La migration `companies` (plan 01-02) doit aussi être appliquée avant pour que les colonnes `raison_sociale`, `adresse`, `cnps_matricule`, `nccm`, `ncc` apparaissent dans les types.

**État actuel des types :**

- `companies` Row : uniquement `{ id, name, convention_collective, created_at }` — manque `raison_sociale`, `adresse`, `cnps_matricule`, `nccm`, `ncc`
- `bulletins_paie` : **table entièrement absente** des types (7 colonnes de primes + `cnps_salarie` + `its` + etc.)
- `employee_salary_history` : **table entièrement absente**
- `employees` Row : manque `sursalaire`, `prime_exceptionnelle`, `prime_salissure`, `prime_depassement`, `prime_fonction`, `prime_transport`, `civilite`, `nationalite`, `etat_civil`, `nb_enfants`, `niveau_etude`, `categorie`, `num_cnps`

**Après régénération :** Les 19 occurrences de `as unknown as` dans le code applicatif disparaissent car les tables et colonnes seront typées correctement. Le contournement `(supabase.from as (t: string) => ...)("employee_salary_history")` dans `app/api/employees/[id]/route.ts` peut être supprimé.

### Pattern 01-02 : Migration SQL `companies` + formulaire

**Migration à créer (nouvelle) :**

```sql
-- supabase/migrations/20260330120000_companies_legal_fields.sql
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS raison_sociale   VARCHAR(200),
  ADD COLUMN IF NOT EXISTS adresse          TEXT,
  ADD COLUMN IF NOT EXISTS cnps_matricule   VARCHAR(30),
  ADD COLUMN IF NOT EXISTS nccm             VARCHAR(30),
  ADD COLUMN IF NOT EXISTS ncc              VARCHAR(30);
```

**Formulaire `ParametresForm.tsx` :** Actuellement gère uniquement `name` et `convention_collective`. Les 5 nouveaux champs doivent être ajoutés. Le composant est un Client Component avec états locaux + `fetch` vers `PUT /api/entreprise`.

**Route `PUT /api/entreprise` :** Le schéma Zod `entrepriseSchema` ne couvre que `name` et `convention_collective`. Il faut étendre avec les 5 nouveaux champs optionnels.

### Pattern 01-03 : Centralisation du calcul de paie

**Problème documenté dans CONCERNS.md (point 14) :** La fonction `previewCalc` dans `PaieDialog.tsx` (lignes 86-115) réimplémente manuellement ce que fait `calculerBulletin()` dans `lib/paie-ci.ts`. Le `PATCH /api/paie/[id]` réimplémente aussi ce calcul inline (lignes 72-80 de la route).

**Analyse du code actuel :**

- `previewCalc` dans `PaieDialog.tsx` : duplique CNPS, CMU, abattement 15%, ITS — mais ne gère pas `prime_anciennete` de la même façon que le backend
- `PATCH /api/paie/[id]` : réimplémente le calcul inline au lieu d'appeler `calculerBulletin()`
- `lib/paie-ci.ts` : la fonction `calculerBulletin()` existe et est correcte mais sa signature actuelle prend `(salaireBrut, autresRetenues, avances)` sans les primes détaillées

**Problème de signature :** `calculerBulletin()` actuelle ne prend pas les 7 lignes de primes séparément. Il faut étendre son interface ou créer une fonction `calculerBulletinComplet()` qui prend toutes les lignes.

**Approche recommandée :** Créer une interface `LignesBulletin` et une fonction `calculerBulletinComplet(lignes: LignesBulletin): ResultatPaieComplet` dans `lib/paie-ci.ts`. `previewCalc` dans `PaieDialog.tsx` devient un simple appel à `calculerBulletinComplet`. `PATCH /api/paie/[id]` appelle aussi `calculerBulletinComplet` au lieu du code inline. `calculerBulletin()` reste pour la rétrocompatibilité.

**Bug de sécurité à corriger dans le même plan :** `PUT /api/paie/[id]` (changement de statut) ne filtre pas par `company_id` — seulement `.eq("id", params.id)`. Fix : ajouter `get_user_company_id()` et `.eq("company_id", companyId)`.

**Fonctions utilitaires dupliquées :**

- `formatAnciennete()` définie dans `employes/[id]/page.tsx` et `paie/[id]/print/page.tsx` — à exporter depuis `lib/paie-ci.ts`
- `scoreLabel()` et `scoreVariant()` définis dans `employes/[id]/page.tsx` et `evaluations/page.tsx` — à exporter depuis un `lib/utils-rh.ts` ou `lib/evaluations.ts`

### Pattern 01-04 : Configuration Vitest dans Next.js 14 App Router

**Contrainte clé :** Next.js 14 utilise `moduleResolution: "bundler"` dans `tsconfig.json`. Vitest a besoin de sa propre configuration pour éviter les conflits avec le plugin `next` de TypeScript.

**Configuration recommandée `vitest.config.ts` :**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', '.next', 'e2e'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

**Pourquoi `environment: 'node'` et non `jsdom` :** Les fonctions `lib/paie-ci.ts` n'utilisent pas le DOM. `node` est plus léger et évite les conflits. Si des tests de composants React sont ajoutés plus tard, un `environment` par fichier peut être spécifié via `// @vitest-environment jsdom`.

**Script `package.json` à ajouter :**

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Note sur TypeScript :** Le `tsconfig.json` inclut `"plugins": [{ "name": "next" }]`. Vitest ne passe pas par le compilateur Next.js — il utilise sa propre résolution. La config `vitest.config.ts` doit redéfinir les alias `@/*` pour éviter les erreurs d'import.

**Tests à écrire (lib/paie-ci.ts — toutes les fonctions exportées) :**

| Fonction | Cas limites critiques |
|----------|----------------------|
| `calculerITS` | 0 FCFA → 0, SMIG (75 000) → tranche 0%, 200 001 → tranche 12%, 350 001 → tranche 18%, 600 001 → tranche 25%, > 600 001 → tranche 32% |
| `calculerBulletin` | Brut au SMIG, brut > plafond CNPS (1 647 315), brut = 0, avec avances |
| `calculerChargesPatronales` | Brut < plafond familiales (70 000), brut > plafond, brut au SMIG |
| `calculerPrimeAnciennete` | 0 ans → 0, 1 an, 25 ans (plafond 25%), > 25 ans (plafond inchangé), date future |
| `calculerProvision13e` | 0 → 0, SMIG → 75%/12 = 4 688, négatif → 0 |
| `calculerIndemniteLicenciement` | 0 an, 5 ans, 10 ans, 11 ans, fraction d'année, 0.5 an |

**Valeurs LF 2026 à vérifier dans les tests :**

- SMIG_MENSUEL = 75 000 FCFA
- TAUX_CNPS_RETRAITE_SALARIE = 6,3%
- PLAFOND_CNPS_MENSUEL = 1 647 315 FCFA
- CMU_MENSUEL = 1 600 FCFA
- Abattement ITS = 15%
- Provision 13e = 75% du brut / 12

### Pattern 01-05 : Sécurité et migrations versionnées

**Vérification rôle admin — pattern existant dans le projet :**

Le projet consulte déjà `profiles.role` dans d'autres routes (ex: `app/api/conges/route.ts` lit `profiles`). Le champ `role` est dans `types/supabase.ts` : `profiles.Row.role: string`.

Pattern à appliquer dans `POST /api/rag/upload` :

```typescript
// Après vérification de l'utilisateur
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

if (profile?.role !== "admin") {
  return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
}
```

**Table `audit_logs` — structure existante :**

```typescript
// Types actuels dans types/supabase.ts
audit_logs.Insert: {
  action: string       // ex: "CREATE_BULLETIN", "UPDATE_EMPLOYEE"
  company_id: string
  user_id: string
  resource?: string | null  // ex: "bulletins_paie:uuid"
}
```

Pattern d'alimentation après opération critique :

```typescript
await supabase.from("audit_logs").insert({
  action: "RAG_UPLOAD",
  company_id: companyId,
  user_id: user.id,
  resource: `legal_documents:${chunkId}`,
});
```

**Migration vers `supabase/migrations/` :** Les 5 scripts `scripts/*.sql` doivent être copiés (pas déplacés — les originaux servent de référence) dans `supabase/migrations/` avec horodatage. Convention : `YYYYMMDDHHMMSS_description.sql`.

Ordre de migration reconstruit depuis les dates des fichiers :

```
supabase/migrations/
  20260324120000_securite_rls.sql         (migration_securite.sql)
  20260325000000_employee_fields.sql      (add_employee_fields.sql)
  20260326090000_bulletin_primes.sql      (add_bulletin_primes.sql)
  20260326094300_employee_primes.sql      (add_employee_primes.sql)
  20260326100700_salary_history.sql       (add_salary_history.sql)
  20260330120000_companies_legal_fields.sql (nouveau — plan 01-02)
```

**Note :** `supabase/migrations/` ne nécessite pas `supabase init` complet. Le CLI reconnaît ce dossier pour `supabase db push`. La création du dossier seul suffit pour le versionnement.

### Anti-Patterns à éviter

- **Ne pas créer une nouvelle fonction de calcul qui doublon de `calculerBulletin`** : étendre la signature existante avec interface discriminée ou paramètre étendu.
- **Ne pas utiliser `any` pour contourner les types manquants** : la régénération des types est précisément là pour éliminer ces contournements.
- **Ne pas écrire des tests qui testent l'implémentation plutôt que le comportement** : tester les valeurs numériques exactes selon les textes légaux CI.
- **Ne pas bypasser la RLS** même temporairement pour les tests — les tests doivent porter sur `lib/paie-ci.ts` uniquement (fonctions pures, pas d'appels Supabase).

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser | Raison |
|----------|-----------------|---------|--------|
| Génération des types TypeScript Supabase | Parser SQL manuellement | `npx supabase gen types typescript` | Produit exactement le fichier attendu par `@supabase/supabase-js` v2 |
| Tests unitaires | Framework maison | Vitest 4.1.2 | Natif ESM, compatible avec l'alias `@/*` via config |
| Vérification du rôle admin | Middleware custom | Query directe `profiles.role` (pattern existant dans le projet) | Simple et cohérent avec l'existant |
| Résolution des alias TypeScript dans Vitest | Hack de require | `resolve.alias` dans `vitest.config.ts` | Vitest supporte les alias Vite nativement |

---

## Runtime State Inventory

> Phase de refactoring/stabilisation — audit des états runtime requis.

| Categorie | Elements trouves | Action requise |
|-----------|-----------------|----------------|
| Stored data | 5 scripts SQL dans `scripts/` appliques manuellement en production (statut inconnu) | Appliquer les scripts manquants en production avant regeneration des types — pas de migration automatique possible, action manuelle dans Supabase Dashboard |
| Live service config | `supabase/migrations/` absent — pas de versionnement formel | Creer le dossier, copier les scripts avec horodatage (code edit seulement) |
| OS-registered state | Aucun — pas de cron, pm2 ou scheduler identifie | Aucune |
| Secrets/env vars | `NEXT_PUBLIC_SUPABASE_URL` contient le project ref necessaire a la commande CLI | Pas de changement de cles — extraction du ref depuis l'URL existante |
| Build artifacts | `.next/` — invalidee apres changement des types TS | `npm run build` apres regeneration des types |

**Risque principal :** L'etat exact des migrations en production est inconnu. Le plan 01-01 doit inclure une etape de verification (requete SQL sur `information_schema.columns` pour confirmer que les colonnes existent avant de regenerer).

---

## Common Pitfalls

### Pitfall 1 : Regénérer les types avant d'appliquer les migrations

**Ce qui va mal :** Exécuter `npx supabase gen types` alors que certaines migrations ne sont pas encore appliquées en production — les types générés seront incomplets et les `as unknown as` resteront.

**Pourquoi ça arrive :** On croit que les scripts `scripts/*.sql` sont déjà appliqués. Le statut est inconnu (pas de `supabase migrations list`).

**Comment éviter :** Vérifier d'abord dans Supabase Dashboard que chaque colonne/table existe : `SELECT column_name FROM information_schema.columns WHERE table_name = 'employees'`. Appliquer les scripts manquants, puis régénérer.

**Signes d'alerte :** Après régénération, `types/supabase.ts` ne contient toujours pas `bulletins_paie` ou `employee_salary_history`.

### Pitfall 2 : Conflits TypeScript entre Next.js et Vitest

**Ce qui va mal :** Vitest ne trouve pas les modules importés avec l'alias `@/` — erreurs `Cannot find module '@/lib/paie-ci'`.

**Pourquoi ça arrive :** Le `tsconfig.json` définit `paths: { "@/*": ["./*"] }` mais Vitest ne lit pas `tsconfig.json` par défaut pour la résolution des modules.

**Comment éviter :** Ajouter dans `vitest.config.ts` :

```typescript
resolve: { alias: { '@': path.resolve(__dirname, '.') } }
```

**Signes d'alerte :** Erreur `ERR_MODULE_NOT_FOUND` ou `Cannot resolve '@/lib/paie-ci'` lors de `npx vitest run`.

### Pitfall 3 : `calculerBulletin()` signature incompatible avec les primes détaillées

**Ce qui va mal :** `calculerBulletin(salaireBrut, autresRetenues, avances)` ne prend que 3 paramètres. Si on l'appelle directement depuis `PaieDialog` ou `PATCH /api/paie/[id]` avec les 7 lignes de primes, les résultats seront faux (primes ignorées dans le calcul).

**Pourquoi ça arrive :** `previewCalc` calcule `total_imposable = salaire_brut + sursalaire + ...` AVANT d'appeler les formules. `calculerBulletin()` prend `salaireBrut` directement et suppose que c'est le total.

**Comment éviter :** Créer `calculerBulletinComplet(lignes: LignesBulletin)` qui construit le `total_imposable` en interne avant de calculer CNPS/ITS. Garder `calculerBulletin()` comme wrapper simplifié pour compatibilité.

### Pitfall 4 : Oublier le fix `PUT /api/paie/[id]` company_id dans le plan 01-03

**Ce qui va mal :** La correction de sécurité du `PUT` (statut bulletin sans filtre `company_id`) est dans le plan 01-03 mais liée conceptuellement au plan 01-05. Elle risque de tomber entre deux chaises.

**Comment éviter :** Le plan 01-03 doit explicitement inclure le fix du `PUT` dans sa liste de changements. C'est une ligne ajoutée : obtenir `companyId` via `get_user_company_id()` et ajouter `.eq("company_id", companyId)`.

### Pitfall 5 : `formulaire ParametresForm` — gestion des champs null vs chaîne vide

**Ce qui va mal :** Les nouveaux champs `raison_sociale`, `adresse` etc. sont `VARCHAR` nullable en base. Le formulaire peut envoyer `""` (chaîne vide) au lieu de `null`. Le bulletin imprimé affichera `""` au lieu de `"—"`.

**Comment éviter :** Dans `app/api/entreprise/route.ts`, transformer `""` en `null` dans le schéma Zod :

```typescript
raison_sociale: z.string().max(200).nullable().optional()
  .transform(v => v === "" ? null : v),
```

---

## Code Examples

### Régénération des types (source : Supabase CLI docs)

```bash
# Extraire le project ref depuis NEXT_PUBLIC_SUPABASE_URL
# URL format: https://<PROJECT_REF>.supabase.co
npx supabase gen types typescript \
  --project-id <PROJECT_REF> \
  --schema public \
  > types/supabase.ts
```

### Vitest config minimale compatible Next.js 14 App Router

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

### Exemple de test `calculerITS` (LF 2026)

```typescript
// lib/__tests__/paie-ci.test.ts
import { describe, it, expect } from 'vitest'
import { calculerITS, SMIG_MENSUEL } from '@/lib/paie-ci'

describe('calculerITS — barème LF 2026', () => {
  it('base imposable = 0 → ITS = 0', () => {
    expect(calculerITS(0)).toBe(0)
  })
  it('base imposable = SMIG (75 000) → ITS = 0 (tranche 0%)', () => {
    expect(calculerITS(SMIG_MENSUEL)).toBe(0)
  })
  it('base imposable = 100 000 → tranche 12% sur 25 000', () => {
    // 75 000 × 0% + 25 000 × 12% = 3 000
    expect(calculerITS(100_000)).toBe(3_000)
  })
  it('base imposable = 350 001 → franchit la tranche 18%', () => {
    // 75k×0% + 125k×12% + 150k×18% + 1×25% = 0 + 15000 + 27000 + 0 = 42000 (arrondi)
    expect(calculerITS(350_001)).toBeGreaterThan(42_000)
  })
})
```

### Vérification rôle admin dans une route Next.js (pattern existant dans le projet)

```typescript
// Pattern à appliquer dans POST /api/rag/upload
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

if (profile?.role !== "admin") {
  return NextResponse.json(
    { error: "Accès réservé aux administrateurs" },
    { status: 403 }
  );
}
```

### Fix `PUT /api/paie/[id]` — ajouter le filtre company_id

```typescript
// Avant (vulnérable) :
const { data, error } = await supabase
  .from("bulletins_paie")
  .update({ statut: parsed.data.statut })
  .eq("id", params.id)

// Après (corrigé) :
const { data: companyId } = await supabase.rpc('get_user_company_id');
const { data, error } = await supabase
  .from("bulletins_paie")
  .update({ statut: parsed.data.statut })
  .eq("id", params.id)
  .eq("company_id", companyId as string)
```

---

## State of the Art

| Ancien état | État cible | Quand | Impact |
|------------|-----------|-------|--------|
| `types/supabase.ts` sans `bulletins_paie`, sans `employee_salary_history`, sans colonnes primes | Types complets et synchronisés | Fin plan 01-01 | Suppression des 19 `as unknown as` applicatifs |
| `previewCalc()` dans `PaieDialog.tsx` duplique le calcul backend | `calculerBulletinComplet()` dans `lib/paie-ci.ts` appelé partout | Fin plan 01-03 | Un changement de taux se propage immédiatement |
| `PUT /api/paie/[id]` sans filtre `company_id` | Filtre `.eq("company_id", companyId)` ajouté | Fin plan 01-03 | Isolation multi-tenant correcte |
| Scripts SQL dans `scripts/` uniquement | `supabase/migrations/` avec convention `YYYYMMDDHHMMSS` | Fin plan 01-05 | Versionnement reproductible |
| `POST /api/rag/upload` accessible à tout utilisateur authentifié | Vérification `profile.role === "admin"` | Fin plan 01-05 | Empoisonnement RAG impossible |
| Zéro test automatisé | Suite Vitest couvrant 6 fonctions `lib/paie-ci.ts` | Fin plan 01-04 | Non-régression sur calculs fiscaux |

---

## Open Questions

1. **Migrations déjà appliquées en production ?**
   - Ce qu'on sait : 5 scripts SQL dans `scripts/`, appliqués manuellement dans l'éditeur Supabase. Git log confirme les commits (`add_employee_primes.sql` est même non commité — untracked).
   - Ce qui est incertain : l'état exact en production (certains scripts peuvent être appliqués, d'autres non).
   - Recommandation : le plan 01-01 doit commencer par une étape de vérification SQL avant d'appliquer quoi que ce soit.

2. **Signature de `calculerBulletinComplet` : nouveau paramètre objet ou surcharge ?**
   - Ce qu'on sait : `calculerBulletin()` prend `(salaireBrut, autresRetenues, avances)`. Les consommateurs actuels (`PaieDialog`, `PATCH /api/paie`) passent 7 lignes de primes séparément.
   - Ce qui est incertain : vaut-il mieux une interface `LignesBulletin` ou garder la signature actuelle et ajouter un objet optionnel de primes ?
   - Recommandation : nouvelle interface `LignesBulletin` + nouvelle fonction `calculerBulletinComplet` — `calculerBulletin` reste comme wrapper. C'est plus explicite pour les futurs développeurs.

3. **`audit_logs` : quelles opérations instrumenter en Phase 1 ?**
   - Ce qu'on sait : la table existe, le plan 01-05 demande de l'alimenter sur les "opérations critiques".
   - Ce qui est incertain : le scope exact (toutes les routes ou juste RAG + paie ?).
   - Recommandation : limiter à 3 opérations en Phase 1 — RAG_UPLOAD, CREATE_BULLETIN, UPDATE_BULLETIN_STATUT. Les autres routes peuvent être instrumentées progressivement dans les phases suivantes.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build / tests | oui | v24.13.0 | — |
| npm | Install packages | oui | (via Node 24) | — |
| npx supabase CLI | Régénération types (01-01) | oui | 2.84.5 | Téléchargement manuel via `npm i -g supabase` |
| vitest | Tests (01-04) | non (pas encore installé) | 4.1.2 disponible | — |
| @vitest/coverage-v8 | Couverture (01-04) | non (pas encore installé) | 4.1.2 disponible | — |
| Supabase Cloud (production) | Appliquer migrations + régénérer types | oui (compte existant) | — | — |

**Dépendances manquantes sans fallback :**

- vitest et @vitest/coverage-v8 : doivent être installés (`npm install --save-dev vitest @vitest/coverage-v8`) — Wave 0 du plan 01-04.

**Dépendances manquantes avec fallback :**

- Aucune.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` — inexistant (Wave 0) |
| Quick run command | `npx vitest run lib/__tests__/paie-ci.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SOC-01 | `types/supabase.ts` compile sans `as unknown as` | Lint/compile | `npx tsc --noEmit` | ✅ (tsconfig existant) |
| SOC-02 | Un changement dans `lib/paie-ci.ts` se propage dans la preview | unit | `npx vitest run lib/__tests__/paie-ci.test.ts` | ❌ Wave 0 |
| SOC-03 | Bulletin imprimé affiche `raison_sociale`, `adresse`, CNPS, NCCM, NCC sans `"—"` | manual (UI) | Test visuel — ouvrir `/paie/[id]/print` | N/A |
| SOC-04 | Suite Vitest 100% verte sur 6 fonctions `lib/paie-ci.ts` | unit | `npx vitest run` | ❌ Wave 0 |

### Sampling Rate

- **Par commit de plan :** `npx tsc --noEmit` (validation TypeScript)
- **Fin plan 01-04 :** `npx vitest run --coverage`
- **Phase gate :** `npx tsc --noEmit && npx vitest run` doit passer à 100% avant `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — configuration Vitest (alias `@/*`, environment `node`)
- [ ] `lib/__tests__/paie-ci.test.ts` — tests couvrant SOC-04
- [ ] `package.json` : ajouter scripts `test`, `test:watch`, `test:coverage`
- [ ] `npm install --save-dev vitest @vitest/coverage-v8` — dépendances manquantes

---

## Sources

### Primary (HIGH confidence)

- Code source du projet — analyse directe de `lib/paie-ci.ts`, `types/supabase.ts`, `components/rh/PaieDialog.tsx`, `app/api/paie/[id]/route.ts`, `app/api/rag/upload/route.ts`, `app/api/entreprise/route.ts`
- `.planning/codebase/CONCERNS.md` — audit complet de la dette technique avec numéros de lignes exacts
- `.planning/codebase/ARCHITECTURE.md` — patterns d'authentification et multi-tenancy
- `package.json` — versions exactes des dépendances installées
- `npm view vitest version` — version 4.1.2 confirmée en registre (2026-03-30)
- `npx supabase --version` — CLI 2.84.5 disponible localement via npx

### Secondary (MEDIUM confidence)

- Analyse de `tsconfig.json` + pattern `moduleResolution: "bundler"` de Next.js 14 pour la config Vitest

### Tertiary (LOW confidence)

- Aucun — toutes les conclusions sont issues de l'analyse directe du code source.

---

## Metadata

**Confidence breakdown:**

- Stack (vitest, supabase CLI) : HIGH — versions vérifiées sur le registre npm et via npx
- Architecture (centralisation calc, patterns RLS) : HIGH — code source analysé ligne par ligne
- Pitfalls : HIGH — issus directement de CONCERNS.md (audit existant avec numéros de lignes)
- Tests (valeurs LF 2026) : HIGH — constantes vérifiées dans `lib/paie-ci.ts` avec commentaires légaux

**Research date:** 2026-03-30
**Valid until:** 2026-09-30 (stack stable — Next.js 14, Supabase, Vitest ; taux LF 2026 valides jusqu'à LF 2027)
