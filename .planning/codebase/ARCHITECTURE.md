# Architecture

**Date d'analyse :** 2026-03-30

## Vue d'ensemble

**Patron global :** SaaS RH multi-tenant — architecture Next.js 14 App Router avec Supabase comme backend complet (base de données, authentification, stockage).

**Caractéristiques clés :**

- Isolation totale des données par entreprise via RLS Supabase (Row Level Security)
- Server Components par défaut pour toutes les pages de tableau de bord — aucun appel API client visible
- Couche API Route Handlers (`app/api/`) pour toutes les mutations — jamais de requêtes Supabase directes depuis les composants client
- IA multi-agents côté serveur uniquement : Claude Sonnet (raisonnement juridique), Gemini Flash (extraction rapide), n8n (RAG pgvector)

---

## Couches de l'architecture

**1. Présentation (Server Components + Client Components) :**

- But : Afficher les données, collecter les saisies utilisateur
- Localisation : `app/(dashboard)/*/page.tsx`
- Contient : pages RSC (React Server Components), layouts, fragments UI
- Dépend de : API Routes pour les mutations, `createServerClient()` pour les lectures directes en RSC
- Utilisé par : le navigateur

**2. Composants métier (Client Components) :**

- But : Formulaires, dialogues, boutons d'action avec état local
- Localisation : `components/rh/`
- Contient : formulaires React Hook Form + Zod, dialogues shadcn/ui
- Dépend de : `fetch()` vers `app/api/`, `createClientSupabase()` pour les lectures temps réel
- Utilisé par : les pages RSC

**3. API Routes (Route Handlers) :**

- But : Mutations sécurisées, validation Zod, logique métier serveur
- Localisation : `app/api/*/route.ts`
- Contient : validation d'entrée Zod, vérification auth Supabase, appels IA, écriture base de données
- Dépend de : `createServerClient()`, `lib/paie-ci.ts`, `lib/ai/orchestrator.ts`
- Utilisé par : composants client via `fetch()`

**4. Bibliothèques utilitaires :**

- But : Clients partagés, calculs métier, intégrations externes
- Localisation : `lib/`
- Contient : clients Supabase (`client.ts`, `server.ts`), moteur de paie (`paie-ci.ts`), orchestrateur IA (`ai/orchestrator.ts`), webhooks n8n (`n8n/webhooks.ts`)
- Dépend de : variables d'environnement
- Utilisé par : API Routes, Server Components

---

## Flux de données

**Lecture des données (Server Components) :**

1. Le middleware `middleware.ts` vérifie la session via `lib/supabase/middleware.ts`
2. Si non authentifié → redirection `/login`
3. La page RSC appelle `createServerClient()` et interroge Supabase directement
4. Supabase applique automatiquement la RLS — seules les données de `company_id` de l'utilisateur remontent
5. Le HTML rendu est envoyé au navigateur

**Mutation des données (Client → API Route → Supabase) :**

1. Le composant client appelle `fetch('/api/[ressource]', { method: 'POST', body: ... })`
2. L'API Route crée `createServerClient()` (cookie de session transmis automatiquement)
3. Vérification `supabase.auth.getUser()` — retourne 401 si absent
4. Validation du corps avec Zod — retourne 400 si invalide
5. Récupération du `company_id` via `supabase.rpc('get_user_company_id')`
6. Insertion/mise à jour dans Supabase avec `company_id` explicite
7. La RLS Supabase bloque toute écriture hors périmètre entreprise
8. Retour JSON au client

**Flux IA (scoring CV, agent juridique) :**

1. API Route reçoit la requête
2. Exécution parallèle (`Promise.all`) : Gemini Flash (extraction rapide) + Claude Sonnet (raisonnement) + n8n RAG (contexte juridique)
3. Synthèse finale par Claude avec les résultats consolidés
4. Persistance en base, retour JSON au client

---

## Authentification et gestion des sessions

**Fournisseur :** Supabase Auth (JWT + cookies SSR)

**Flux de connexion :**

1. Utilisateur soumet `/login` → `supabase.auth.signInWithPassword()` côté client
2. Supabase retourne un JWT, stocké dans un cookie HttpOnly géré par `@supabase/ssr`
3. À chaque requête, `middleware.ts` appelle `updateSession()` pour rafraîchir le token
4. Les pages protégées appellent `supabase.auth.getUser()` pour valider la session
5. En cas d'échec : redirection `/login`

**Callback OAuth :** `app/api/auth/callback/route.ts` — échange le code PKCE contre une session, redirige vers `/rh`

**Routes publiques** (définies dans `lib/supabase/middleware.ts`) : `/login`, `/register`, `/auth`, `/_next`, `/favicon`

---

## Multi-tenancy

**Principe :** Chaque ligne de chaque table contient `company_id UUID NOT NULL REFERENCES companies(id)`.

**Résolution du `company_id` :** Fonction Postgres `get_user_company_id()` — lit le `company_id` du profil de l'utilisateur connecté via `auth.uid()`.

**Application dans le code :**

- API Routes : `await supabase.rpc('get_user_company_id')` avant toute écriture
- Insertion : `company_id` toujours injecté explicitement dans la payload : `{ ...data, company_id: companyId }`
- Lecture : aucun filtre manuel nécessaire — la RLS l'applique automatiquement

**Politiques RLS en production :**

| Table | Politique |
|---|---|
| `employees`, `contracts`, `conges`, `evaluations`, `candidates`, `job_postings`, `legal_cases`, `notifications`, `documents` | `USING (company_id = get_user_company_id())` |
| `bulletins_paie` | `USING (company_id = get_user_company_id())` |
| `companies` | `SELECT` et `UPDATE` uniquement pour `id = get_user_company_id()` |
| `profiles` | Lecture entreprise + mise à jour uniquement de son propre profil (`auth.uid()`) |
| `legal_documents` | Documents publics (`company_id IS NULL`) + documents privés de l'entreprise |
| `audit_logs` | Lecture + insertion uniquement, jamais de modification |
| `employee_salary_history` | `USING (company_id = get_user_company_id())` |

---

## Modules métier

**Tableau de bord** (`app/(dashboard)/rh/page.tsx`) :

- Agrège les KPI en parallèle (`Promise.all`) : effectif actif, part féminine, CDD expirants, postes ouverts, évaluations en attente, contentieux ouverts
- Répartition par département et congés en attente

**Employés** (`app/(dashboard)/employes/`) :

- Liste avec tableau : `components/rh/EmployeeTable.tsx`
- Fiche individuelle : `app/(dashboard)/employes/[id]/page.tsx` — profil complet avec ancienneté calculée
- Champs étendus : civilité, nationalité, état civil, nb enfants, niveau d'étude, catégorie professionnelle CCI, primes rattachées au profil

**Contrats** (`app/(dashboard)/contrats/`) :

- Types : CDI, CDD, Stage, Apprentissage
- Suivi des renouvellements CDD (max 2 → conversion CDI obligatoire Art. 15 CT-CI)
- Création automatique du contrat lors de l'ajout d'un employé (si type + salaire renseignés)

**Congés** (`app/(dashboard)/conges/`) :

- Workflow d'approbation : demande → approuvé / refusé
- Composant : `components/rh/CongesApprovalButton.tsx`

**Paie** (`app/(dashboard)/paie/`) :

- Calcul droit ivoirien : CNPS retraite (6,3% plafonné), CMU (1 600 FCFA), ITS progressif
- 8 lignes de bulletin : salaire catégoriel, sursalaire, ancienneté (auto), prime exceptionnelle/13e mois, salissure, dépassement, fonction, transport (non imposable)
- Historique : `employee_salary_history` — snapshot à chaque modification salariale
- Impression bulletin : `app/(dashboard)/paie/[id]/print/page.tsx`

**Recrutement** (`app/(dashboard)/recrutement/`) :

- Offres d'emploi (`job_postings`) + candidats (`candidates`)
- Scoring IA : Gemini Flash (extraction CV) + Claude Sonnet (scoring multi-critères) en parallèle
- Statuts candidat : en_cours, shortlist, entretien, refus

**Evaluations** (`app/(dashboard)/evaluations/`) :

- Périodicité configurable, scores JSON multidimensionnels
- Alertes automatiques si brouillon depuis > 7 jours

**Contentieux** (`app/(dashboard)/contentieux/`) :

- Dossiers contentieux (`legal_cases`) avec priorité et type de cas
- Clôture via `components/rh/CloseLegalCaseButton.tsx`

**Agent Juridique** (`app/(dashboard)/agent-juridique/`) :

- Chat RAG : questions → n8n (embeddings pgvector) + fallback Supabase full-text
- Reformulation Gemini Flash + réponse Claude Sonnet avec citations d'articles
- Base de connaissances : `legal_documents` (textes du Code du Travail CI)

**Calculateur RH** (`app/(dashboard)/calculateur/`) :

- Calculs interactifs côté client : indemnité de licenciement, prime d'ancienneté, heures supplémentaires
- Fonctions : `calculerIndemniteLicenciement()`, `calculerPrimeAnciennete()`, `calculerChargesPatronales()` depuis `lib/paie-ci.ts`

**Notifications** (`app/(dashboard)/notifications/`) :

- Alertes : contrats CDD expirant dans 1j/7j/15j/30j, évaluations en retard
- Synchronisation manuelle ou via n8n (cron quotidien) : `POST /api/notifications/sync`

---

## Moteur de calcul de paie ivoirien

**Fichier :** `lib/paie-ci.ts`

**Sources légales implémentées :**

- SMIG : 75 000 FCFA/mois (Décret n°2022-986)
- CNPS retraite salariale : 6,30% plafonné à 1 647 315 FCFA/mois
- CMU (CNAM) : forfait 1 600 FCFA
- ITS (barème progressif CGI CI Art. 116) : 0% → 12% → 18% → 25% → 32%
- Charges patronales : familiales (5%), maternité (0,75%), retraite (7,7%), AT/MP (3%), FDFP (1%)
- Prime d'ancienneté : 1% × années × salaire catégoriel, plafond 25% (CCI Art. 17)
- Indemnité de licenciement : tranches 30%/35%/40% selon ancienneté (Art. 74 CT-CI)
- Provision 13e mois : 75% du salaire brut / 12 par mois

---

## Orchestrateur IA

**Fichier :** `lib/ai/orchestrator.ts`

**Règle absolue :** aucun appel IA depuis le client — serveur uniquement.

**Agents disponibles :**

- `extraireInfosCV()` — Gemini Flash : extraction structurée JSON depuis texte CV
- `scorerCV()` — Claude Sonnet : scoring multi-critères (compétences 35pt, expérience 30pt, formation 20pt, adéquation 15pt)
- `obtenirContexteJuridique()` — n8n webhooks → pgvector : contexte droit ivoirien
- `analyserCandidat()` — orchestrateur principal : exécution parallèle des 3 agents puis synthèse Claude
- `questionnerAssistantRH()` — RAG n8n + reformulation Gemini

---

## Gestion des erreurs

**Stratégie :** retour JSON standardisé `{ error: string }` avec codes HTTP appropriés

**Patterns dans les API Routes :**

- 401 : `!user` après `supabase.auth.getUser()`
- 400 : échec `zod.safeParse()` — détails dans `parsed.error.flatten()`
- 403 : `company_id` introuvable via `get_user_company_id()`
- 404 : ressource inexistante après select
- 409 : contrainte d'unicité Postgres (code `23505`) — ex. bulletin déjà existant pour la période
- 500 : erreur Supabase générique
- 502 : erreur appel IA externe (Claude, Gemini)

---

*Analyse architecture : 2026-03-30*
