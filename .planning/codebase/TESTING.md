# Patterns de Test

**Date d'analyse :** 2026-03-30

---

## État des tests automatisés

**Résumé : aucun test automatisé configuré et aucun fichier de test présent dans le code applicatif.**

Aucun des éléments suivants n'a été détecté dans le projet (hors `node_modules`) :
- Fichiers `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
- Configuration Jest (`jest.config.*`)
- Configuration Vitest (`vitest.config.*`)
- Configuration Playwright applicative (`playwright.config.*` à la racine)
- Scripts `test`, `test:watch`, `test:coverage` dans `package.json`

Playwright est présent en `devDependencies` (`"playwright": "^1.58.2"`) mais sans configuration ni tests écrits.

---

## Scripts disponibles

```bash
npm run dev      # Serveur de développement Next.js
npm run build    # Build production — vérifie TypeScript et compile
npm run start    # Démarrage production
npm run lint     # ESLint via next lint
```

**Le script `npm run build` est la seule vérification automatisée active.** Il effectue :
- Vérification TypeScript complète (mode strict)
- Vérification des imports cassés
- Compilation des Server/Client Components

---

## Lacunes de couverture de test

### Logique de calcul métier (priorité haute)

`lib/paie-ci.ts` contient des fonctions purement calculatoires sans aucun test :

| Fonction | Risque si non testée |
|---|---|
| `calculerITS(salaireImposable)` | Erreur dans le barème progressif = bulletins faux |
| `calculerBulletin(brut, retenues, avances)` | Net à payer incorrect pour les employés |
| `calculerChargesPatronales(brut)` | Déclarations CNPS erronées |
| `calculerPrimeAnciennete(salaire, dateEmbauche)` | Calcul par tranche d'années défaillant |
| `calculerIndemniteLicenciement(salaire, annees)` | Calcul par tranche incorrectement appliqué |
| `calculerProvision13e(salaire)` | Provision mensuelle fausse |

Ces fonctions sont le coeur légal de l'application. Une régression silencieuse ici a un impact direct sur la paie des employés.

### Routes API (priorité haute)

Aucun test d'intégration pour les routes sous `app/api/`. Les points critiques non couverts :
- `app/api/paie/route.ts` — calcul CNPS/ITS côté serveur
- `app/api/employees/route.ts` — création automatique du contrat associé
- `app/api/conges/route.ts` — logique d'approbation
- `app/api/legal-cases/route.ts` — gestion des cas contentieux
- Validation RLS : vérifier qu'un utilisateur d'une entreprise A ne peut pas accéder aux données de l'entreprise B

### Composants UI (priorité basse)

Aucun test de composant (Vitest + Testing Library ou Playwright). Non bloquant à ce stade vu la taille du projet.

---

## Vérification manuelle — approche actuelle

En l'absence de tests automatisés, la vérification se fait par test fonctionnel manuel.

### Vérifier un calcul de bulletin de paie

1. Créer un employé avec un salaire brut connu (ex. 200 000 FCFA)
2. Créer un bulletin de paie via `POST /api/paie`
3. Vérifier les montants attendus selon `lib/paie-ci.ts` :
   - CNPS retraite = min(200 000, 1 647 315) × 6,3% = 12 600 FCFA
   - CMU salariale = 1 600 FCFA
   - Base ITS = 200 000 - 12 600 - (200 000 × 15%) = 157 400 FCFA
   - ITS sur 157 400 FCFA = 0 + (125 000 × 12%) + (32 400 × 18%) = 15 000 + 5 832 = 20 832 FCFA
   - Net = 200 000 - 14 200 - 20 832 = 164 968 FCFA

### Vérifier l'isolation multi-tenant (RLS)

1. Créer deux comptes sur deux entreprises différentes
2. Se connecter avec le compte entreprise A
3. Tenter d'accéder à `GET /api/employees` — vérifier que seuls les employés de l'entreprise A apparaissent
4. Tenter `GET /api/employees?company_id=<id_entreprise_B>` — le RLS doit ignorer ce paramètre

### Vérifier le build TypeScript

```bash
npm run build
# Doit terminer sans erreur TypeScript
# Les warnings "any" indiqueraient une violation de convention
```

### Vérifier le lint

```bash
npm run lint
# Doit passer sans erreur
```

---

## Recommandations pour implémenter les tests

### Priorité 1 — Tests unitaires de `lib/paie-ci.ts`

Installer Vitest (compatible Next.js 14 sans configuration complexe) :

```bash
npm install -D vitest @vitest/ui
```

Créer `lib/paie-ci.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { calculerITS, calculerBulletin, SMIG_MENSUEL } from "./paie-ci";

describe("calculerITS", () => {
  it("retourne 0 pour un salaire sous le SMIG", () => {
    expect(calculerITS(74_999)).toBe(0);
  });
  it("applique le taux de 12% sur la tranche 75 000 – 200 000", () => {
    expect(calculerITS(150_000)).toBe(Math.round(75_000 * 0.12));
  });
});

describe("calculerBulletin", () => {
  it("calcule un net cohérent pour un salaire de 200 000 FCFA", () => {
    const r = calculerBulletin(200_000);
    expect(r.cnps_retraite).toBe(12_600);
    expect(r.cmu_salarie).toBe(1_600);
    expect(r.salaire_net).toBeGreaterThan(0);
    expect(r.salaire_net).toBeLessThan(200_000);
  });
});
```

### Priorité 2 — Tests Playwright pour les flux critiques

Créer `playwright.config.ts` et écrire des tests E2E pour :
- Connexion / déconnexion
- Création d'un employé et vérification de son affichage dans la liste
- Génération d'un bulletin de paie et contrôle du montant net affiché

### Script à ajouter dans `package.json`

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test"
  }
}
```

---

## Fichiers clés à tester en priorité

- `lib/paie-ci.ts` — logique de calcul entièrement pure (pas de dépendances externes), idéale pour les tests unitaires
- `app/api/paie/route.ts` — route de création de bulletin, contient des calculs CNPS/ITS dupliqués depuis `lib/paie-ci.ts`
- `app/api/employees/route.ts` — contient la logique de création automatique de contrat

---

*Analyse des tests : 2026-03-30*
