# Intégrations Externes

**Date d'analyse :** 2026-03-30

## Base de données & Backend — Supabase

**Fournisseur :** Supabase Cloud (PostgreSQL 15, pgvector activé)

**SDK :**
- `@supabase/supabase-js ^2.99.3` — client principal
- `@supabase/ssr ^0.9.0` — gestion des cookies pour Next.js App Router

**Clients instanciés :**
- Client navigateur : `lib/supabase/client.ts` → `createBrowserClient()` (composants client)
- Client serveur : `lib/supabase/server.ts` → `createServerClient()` (Server Components / Route Handlers)
- Client middleware : `lib/supabase/middleware.ts` → `updateSession()` (protection des routes)

**Variables d'environnement :**
- `NEXT_PUBLIC_SUPABASE_URL` — URL publique du projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — clé anonyme publique

### Tables (schéma `public`)

| Table | Description |
|-------|-------------|
| `companies` | Entreprises clientes (tenant racine). Champs : `id`, `name`, `convention_collective` |
| `profiles` | Utilisateurs RH liés à une entreprise. Champ `role` (admin, manager…) |
| `employees` | Salariés. Inclut `salaire_brut`, `type_contrat`, `matricule`, `num_cnps` |
| `contracts` | Contrats de travail (CDI/CDD). Champs : `type_contrat`, `salaire_brut`, `date_fin_essai`, `renouvellement_count` |
| `conges` | Demandes de congé |
| `bulletins_paie` | Bulletins de paie générés. Inclut primes (`prime_anciennete`, `prime_transport`, `sursalaire`…) |
| `employee_salary_history` | Historique des évolutions salariales avec `date_effet` |
| `evaluations` | Évaluations salariées avec `scores` (JSONB) et `score_global` |
| `documents` | Pièces jointes RH (CV, contrats…). Champ `famille` pour catégoriser |
| `job_postings` | Offres d'emploi. Champ `competences` (array) |
| `candidates` | Candidats recrutement. Champs `score_ia`, `score_detail` (JSONB), `cv_url` |
| `legal_cases` | Dossiers contentieux. Champ `type_cas`, `priorite` |
| `legal_documents` | Textes juridiques indexés pour le RAG. Champ `embedding` (pgvector), `company_id` nullable (documents partagés) |
| `notifications` | Alertes utilisateur. Champ `lu` (boolean) |
| `audit_logs` | Journal d'actions immuable. Actions : CREATE / UPDATE / DELETE |

### Fonctions Postgres

| Fonction | Description |
|----------|-------------|
| `get_user_company_id()` | Retourne le `company_id` de l'utilisateur connecté (utilisée dans toutes les RLS policies) |
| `match_legal_documents(query_embedding, match_threshold, match_count, filter_company_id)` | Recherche vectorielle pgvector sur `legal_documents` |

### Row Level Security (RLS)

Toutes les tables ont RLS activé. Règle systématique :
```sql
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id())
```
Aucune requête ne doit bypasser le RLS.

### Storage Supabase

**Buckets détectés :**
- `legal-documents` — stockage de fichiers PDF juridiques (route `app/api/rag/upload/route.ts`)
- Bucket générique pour les documents RH (chemin : `documents/{companyId}/{employeeId}/{famille}/{timestamp}_{filename}`, via `lib/supabase/storage.ts`)

**Helpers :**
- `lib/supabase/storage.ts` → `uploadDocument()`, `buildStoragePath()`

---

## Intelligence Artificielle — Claude (Anthropic)

**SDK :** `@anthropic-ai/sdk ^0.80.0`
**Modèle utilisé :** `claude-sonnet-4-20250514` (constante `CLAUDE_MODEL` dans `lib/claude/index.ts`)
**Client :** `lib/claude/index.ts` → instance `anthropic` (serveur uniquement)

**Variable d'environnement :**
- `ANTHROPIC_API_KEY` — clé API Anthropic (jamais exposée au client)

**Usages dans le code :**
- Scoring de CV candidat (route `app/api/recrutement/score-cv`) via `lib/ai/orchestrator.ts`
- Synthèse finale d'analyse candidat après exécution parallèle des agents
- Agent juridique RAG : réponse expert en droit du travail ivoirien (`app/api/rag/query/route.ts`)
- Prompt système : expert droit ivoirien, cite les articles (Art. X Code du Travail CI), répond en français

---

## Intelligence Artificielle — Gemini (Google)

**SDK :** `@google/genai ^1.46.0`
**Modèles configurés :**
- `gemini-2.0-flash` (constante `GEMINI_FLASH`) — tâches rapides, extraction structurée
- `gemini-2.0-pro-exp` (constante `GEMINI_PRO`) — raisonnement profond (non utilisé en production à ce jour)
**Client :** `lib/gemini/index.ts` → instance `gemini` (serveur uniquement)

**Variable d'environnement :**
- `GEMINI_API_KEY` — clé API Google Generative AI

**Usages :**
- Extraction structurée des informations d'un CV (JSON : nom, email, compétences, expérience…)
- Reformulation de questions RH pour améliorer la recherche juridique RAG
- Tâches de faible coût en parallèle avec Claude (via `Promise.all`)

---

## Orchestration IA Multi-Agent

**Fichier :** `lib/ai/orchestrator.ts`

**Architecture :**
- Exécution **parallèle** (`Promise.all`) des 3 agents pour minimiser la latence
- Agent 1 (Gemini Flash) : extraction structurée du CV
- Agent 2 (Claude Sonnet) : scoring et recommandation (shortlist / refus / en_attente)
- Agent 3 (n8n → pgvector) : contexte juridique ivoirien via RAG
- Synthèse finale : Claude Sonnet (après récupération des 3 résultats)

**Fonctions exportées :**
- `analyserCandidat(input)` — analyse complète d'un candidat
- `questionnerAssistantRH(input)` — assistant juridique RAG

---

## Automatisation — n8n

**Plateforme :** Hugging Face Space (`yobed-n8n-supabase-claude.hf.space`)
**Client :** `lib/n8n/webhooks.ts` → `triggerN8n(path, payload)`

**Variables d'environnement :**
- `N8N_BASE_URL` — URL de base du serveur n8n
- `N8N_WEBHOOK_SECRET` — secret d'authentification (header `X-Webhook-Secret`)

**Webhooks déclenchés depuis Next.js :**

| Chemin webhook | Usage |
|----------------|-------|
| `webhook/rag/query` | Recherche RAG pgvector : reçoit `{ question, company_id }`, retourne `{ reponse, sources }` |

**Responsabilités n8n :**
- Calcul d'embeddings et recherche vectorielle pgvector (`match_legal_documents`)
- Orchestration des appels vers Supabase pour le RAG juridique

---

## Authentification

**Fournisseur :** Supabase Auth (Email/Mot de passe)

**Implémentation :**
- Sessions gérées via cookies HTTP (SSR-compatible)
- Middleware Next.js : `middleware.ts` → `lib/supabase/middleware.ts` → `updateSession()`
- Routes publiques : `/login`, `/register`, `/auth/*`
- Toutes les autres routes redirigent vers `/login` si non authentifié
- Callback OAuth : `app/api/auth/callback/route.ts` (échange `code` → session)
- Table `profiles` liée à `auth.users` via l'ID Supabase

---

## Stockage de fichiers

**Fournisseur :** Supabase Storage

**Buckets :**
- `legal-documents` — documents juridiques PDF pour le RAG (partagés entre tenants)
- Bucket documents RH (chemin structuré par `companyId/employeeId/famille/`)

**Chemin des documents RH :**
```
documents/{companyId}/{employeeId}/{famille}/{timestamp}_{filename}
```

---

## Calcul de paie — Droit ivoirien

**Module interne :** `lib/paie-ci.ts` (aucun service externe)

**Fonctions exportées :**
- `calculerBulletin(salaireBrut, autresRetenues, avances)` → `ResultatPaie`
- `calculerChargesPatronales(salaireBrut)` → `ChargesPatronales`
- `calculerITS(salaireImposable)` — barème progressif ITS (CGI CI Art. 116)
- `calculerPrimeAnciennete(salaireCat, dateEmbauche)` — CCI CI Art. 17
- `calculerProvision13e(salaireBrut)` — 75% salaire brut / 12
- `calculerIndemniteLicenciement(salaireMoyen12Mois, annees)` — Art. 74 CT-CI

**Constantes réglementaires CI :**
- SMIG mensuel : 75 000 FCFA (Décret n°2022-986)
- CNPS retraite salarié : 6,30% plafonné à 1 647 315 FCFA/mois
- CMU forfait : 1 600 FCFA/mois
- Charges patronales : familiales 5%, maternité 0,75%, retraite 7,7%, AT/MP 3%, FDFP 1%

---

## Routes API (app/api/)

| Route | Méthodes | Description |
|-------|----------|-------------|
| `auth/callback` | GET | Échange code OAuth → session Supabase |
| `employees` | GET, POST | Liste et création d'employés |
| `employees/[id]` | GET, PUT, DELETE | CRUD employé individuel |
| `employees/next-matricule` | GET | Génération du prochain numéro de matricule |
| `contracts` | GET, POST | Contrats de travail |
| `contracts/[id]` | GET, PUT, DELETE | CRUD contrat individuel |
| `conges` | GET, POST | Demandes de congé |
| `conges/[id]` | GET, PUT, DELETE | CRUD congé individuel |
| `paie` | GET, POST | Bulletins de paie |
| `paie/[id]` | GET, PUT, DELETE | CRUD bulletin individuel |
| `documents` | GET, POST | Documents RH |
| `evaluations` | GET, POST | Évaluations |
| `evaluations/[id]` | GET, PUT, DELETE | CRUD évaluation |
| `legal-cases` | GET, POST | Dossiers contentieux |
| `legal-cases/[id]` | GET, PUT, DELETE | CRUD dossier |
| `notifications/sync` | POST | Synchronisation notifications |
| `recrutement/postes` | GET, POST | Offres d'emploi |
| `recrutement/candidats` | GET, POST | Candidats |
| `recrutement/candidats/[id]` | GET, PUT, DELETE | CRUD candidat |
| `recrutement/score-cv` | POST | Scoring IA d'un CV (orchestrateur multi-agent) |
| `rag/query` | POST | Requête assistant juridique (Claude + pgvector) |
| `rag/upload` | GET, POST, DELETE | Gestion des documents RAG |
| `profil` | GET, PUT | Profil de l'utilisateur connecté |
| `entreprise` | GET, PUT | Informations de l'entreprise |

---

## Variables d'environnement — récapitulatif

| Variable | Exposition | Usage |
|----------|-----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Serveur | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Serveur | Clé anonyme Supabase |
| `ANTHROPIC_API_KEY` | Serveur uniquement | API Claude Anthropic |
| `GEMINI_API_KEY` | Serveur uniquement | API Gemini Google |
| `N8N_BASE_URL` | Serveur uniquement | URL serveur n8n |
| `N8N_WEBHOOK_SECRET` | Serveur uniquement | Secret webhook n8n |

---

## CI/CD & Déploiement

**Frontend :** Vercel (déploiement continu depuis git)
**Base de données :** Supabase Cloud
**Automatisation IA :** n8n sur Hugging Face Space (`yobed-n8n-supabase-claude.hf.space`)
**Pipeline CI :** Non détecté (pas de `.github/workflows/`)

---

*Audit intégrations : 2026-03-30*
