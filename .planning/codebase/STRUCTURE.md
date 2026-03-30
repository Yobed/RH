# Structure du projet

**Date d'analyse :** 2026-03-30

## Arborescence générale

```
Ressource Humaine/          # Racine du projet
├── app/                    # Next.js App Router — pages et API
│   ├── (auth)/             # Groupe de routes publiques (login/register)
│   ├── (dashboard)/        # Groupe de routes protégées (modules RH)
│   ├── api/                # Route Handlers Next.js (mutations uniquement)
│   ├── layout.tsx          # Layout racine (HTML, providers globaux)
│   └── page.tsx            # Redirection racine → /rh ou /login
├── components/
│   ├── rh/                 # Composants métier RH (Client Components)
│   └── ui/                 # Composants shadcn/ui de base
├── lib/
│   ├── supabase/           # Clients Supabase (client, server, middleware, storage)
│   ├── ai/                 # Orchestrateur IA multi-agents
│   ├── claude/             # Client Claude Anthropic
│   ├── gemini/             # Client Google Gemini
│   ├── n8n/                # Webhooks n8n
│   ├── paie-ci.ts          # Moteur de calcul paie droit ivoirien
│   └── utils.ts            # Utilitaires généraux (cn, formatage)
├── types/
│   └── supabase.ts         # Types TypeScript générés depuis le schéma Supabase
├── scripts/                # Migrations SQL Supabase (à exécuter manuellement)
├── skills/                 # Documentation pilotage Claude Code (SKILL.md par domaine)
├── supabase/               # Config Supabase local (temp)
├── middleware.ts            # Point d'entrée middleware Next.js
├── CLAUDE.md               # Instructions pilotage Claude Code
├── next.config.mjs         # Configuration Next.js
├── tailwind.config.ts      # Configuration Tailwind CSS
└── tsconfig.json           # Configuration TypeScript
```

---

## Détail des répertoires

### `app/(auth)/`
- **But :** Pages publiques non protégées par le middleware
- **Fichiers clés :**
  - `app/(auth)/layout.tsx` — layout centré pour les pages d'authentification
  - `app/(auth)/login/page.tsx` — formulaire de connexion (Client Component, `supabase.auth.signInWithPassword`)
  - `app/(auth)/register/page.tsx` — création de compte (Client Component, `supabase.auth.signUp`)

### `app/(dashboard)/`
- **But :** Toutes les pages protégées du tableau de bord RH
- **Layout :** `app/(dashboard)/layout.tsx` — sidebar navy `SidebarNav`, topbar avec `NotificationBell`, vérification session serveur
- **Pages :**

| Route | Fichier | Description |
|---|---|---|
| `/rh` | `app/(dashboard)/rh/page.tsx` | Tableau de bord — KPI, répartition depts, congés en attente |
| `/employes` | `app/(dashboard)/employes/page.tsx` | Liste des employés |
| `/employes/[id]` | `app/(dashboard)/employes/[id]/page.tsx` | Fiche employé — profil, contrats, documents, historique |
| `/contrats` | `app/(dashboard)/contrats/page.tsx` | Gestion des contrats CDI/CDD |
| `/conges` | `app/(dashboard)/conges/page.tsx` | Demandes de congés, workflow approbation |
| `/paie` | `app/(dashboard)/paie/page.tsx` | Bulletins de paie |
| `/paie/[id]/print` | `app/(dashboard)/paie/[id]/print/page.tsx` | Version imprimable du bulletin |
| `/recrutement` | `app/(dashboard)/recrutement/page.tsx` | Offres d'emploi + candidats avec scoring IA |
| `/evaluations` | `app/(dashboard)/evaluations/page.tsx` | Évaluations des performances |
| `/contentieux` | `app/(dashboard)/contentieux/page.tsx` | Dossiers contentieux |
| `/notifications` | `app/(dashboard)/notifications/page.tsx` | Centre de notifications |
| `/archives` | `app/(dashboard)/archives/page.tsx` | Archives documentaires |
| `/agent-juridique` | `app/(dashboard)/agent-juridique/page.tsx` | Chatbot RAG droit du travail CI |
| `/calculateur` | `app/(dashboard)/calculateur/page.tsx` | Calculateur RH interactif |
| `/parametres` | `app/(dashboard)/parametres/page.tsx` | Paramètres entreprise |

### `app/api/`
- **But :** Route Handlers — toutes les mutations passent ici, jamais de Supabase directement depuis le client
- **Inventaire complet :**

| Endpoint | Méthodes | Description |
|---|---|---|
| `POST /api/employees` | POST | Créer un employé (+ contrat auto si type + salaire) |
| `GET /api/employees/[id]` | GET, PUT, DELETE | Lire / modifier / désactiver un employé |
| `GET /api/employees/next-matricule` | GET | Générer le prochain matricule disponible |
| `GET /api/contracts` | GET, POST | Lister / créer contrats |
| `GET /api/contracts/[id]` | GET, PUT, DELETE | Opérations sur un contrat |
| `GET /api/conges` | GET, POST | Lister / créer demandes de congés |
| `GET /api/conges/[id]` | GET, PUT, DELETE | Approuver / refuser / supprimer |
| `GET /api/paie` | GET, POST | Lister bulletins / créer bulletin (calcul ITS+CNPS auto) |
| `GET /api/paie/[id]` | GET, PUT, DELETE | Opérations sur un bulletin |
| `POST /api/recrutement/postes` | GET, POST | Offres d'emploi |
| `POST /api/recrutement/candidats` | GET, POST | Candidats |
| `PUT /api/recrutement/candidats/[id]` | GET, PUT, DELETE | Opérations sur un candidat |
| `POST /api/recrutement/score-cv` | POST | Scoring IA (Gemini Flash + Claude Sonnet en parallèle) |
| `GET /api/evaluations` | GET, POST | Évaluations |
| `PUT /api/evaluations/[id]` | GET, PUT, DELETE | Opérations sur une évaluation |
| `GET /api/legal-cases` | GET, POST | Dossiers contentieux |
| `PUT /api/legal-cases/[id]` | GET, PUT, DELETE | Opérations sur un dossier |
| `POST /api/notifications/sync` | POST | Sync notifications (contrats expirants + évals en retard) |
| `GET /api/documents` | GET, POST | Gestion documents (lié au stockage Supabase) |
| `POST /api/rag/query` | POST | Agent juridique : RAG n8n + fallback Supabase + Claude |
| `POST /api/rag/upload` | POST | Upload document dans la base RAG |
| `GET /api/profil` | GET, PUT | Profil utilisateur connecté |
| `GET /api/entreprise` | GET, PUT | Paramètres de l'entreprise |
| `GET /api/auth/callback` | GET | Callback PKCE Supabase OAuth |

### `components/rh/`
- **But :** Composants métier — tous sont des Client Components (`"use client"`)
- **Convention de nommage :** PascalCase, suffixe fonctionnel

| Composant | Rôle |
|---|---|
| `SidebarNav.tsx` | Navigation principale avec état actif via `usePathname()` |
| `UserMenu.tsx` | Menu utilisateur avec déconnexion |
| `NotificationBell.tsx` | Icône cloche avec badge compteur non lus |
| `NotificationSyncButton.tsx` | Bouton de synchronisation manuelle des notifications |
| `NotificationMarkAllRead.tsx` | Marquer toutes les notifications comme lues |
| `KpiCard.tsx` | Carte KPI réutilisable (variants : default, success, warning, danger) |
| `EmployeeDialog.tsx` | Formulaire création/édition employé (React Hook Form + Zod) |
| `EmployeeTable.tsx` | Tableau paginé des employés |
| `ContractDialog.tsx` | Formulaire contrat |
| `CongesDialog.tsx` | Formulaire demande de congé |
| `CongesApprovalButton.tsx` | Bouton approbation/refus congé |
| `PaieDialog.tsx` | Formulaire bulletin de paie avec 8 lignes de salaire |
| `PaieStatusButton.tsx` | Changement de statut du bulletin |
| `EvaluationDialog.tsx` | Formulaire évaluation |
| `EvaluationStatusButton.tsx` | Changement de statut évaluation |
| `LegalCaseDialog.tsx` | Formulaire dossier contentieux |
| `CloseLegalCaseButton.tsx` | Clôturer un dossier contentieux |
| `JobPostingDialog.tsx` | Formulaire offre d'emploi |
| `CandidateDialog.tsx` | Formulaire candidat |
| `CandidateStatusSelect.tsx` | Sélecteur statut candidat |
| `ScoreCvButton.tsx` | Déclencheur scoring IA CV |
| `DocumentUploadDialog.tsx` | Upload document vers Supabase Storage |
| `LegalDocUpload.tsx` | Upload document dans la base RAG (`legal_documents`) |
| `RagChat.tsx` | Interface chat agent juridique |
| `CalculateurRH.tsx` | Calculateur interactif (indemnités, ancienneté, charges) |
| `ParametresForm.tsx` | Formulaire paramètres entreprise |
| `PrintButton.tsx` | Bouton impression bulletin de paie |

### `components/ui/`
- **But :** Composants shadcn/ui de base, non modifiés ou légèrement étendus
- **Fichiers :** `badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `table.tsx`, `textarea.tsx`
- **Note :** `input.tsx` utilise `React.forwardRef` pour la compatibilité react-hook-form

### `lib/supabase/`
- **But :** Trois clients Supabase distincts selon le contexte d'exécution

| Fichier | Fonction exportée | Contexte d'utilisation |
|---|---|---|
| `lib/supabase/client.ts` | `createClientSupabase()` | Composants client (navigateur) — `"use client"` requis |
| `lib/supabase/server.ts` | `createServerClient()` | Server Components + API Routes — accès aux cookies Next.js |
| `lib/supabase/middleware.ts` | `updateSession()` | `middleware.ts` uniquement — rafraîchissement session |
| `lib/supabase/storage.ts` | `uploadDocument()`, `buildStoragePath()` | Upload fichiers vers Supabase Storage depuis le client |

**Chemin de stockage :** `documents/{company_id}/{employee_id}/{famille}/{timestamp}_{filename}`

### `lib/ai/`
- **Fichier :** `lib/ai/orchestrator.ts`
- **But :** Orchestration des agents IA — serveur uniquement, jamais importé côté client
- **Fonctions exportées :**
  - `analyserCandidat(input)` — analyse complète CV (Gemini + Claude + n8n en parallèle)
  - `questionnerAssistantRH(input)` — RAG + reformulation Gemini

### `lib/`
- `lib/paie-ci.ts` — moteur de calcul paie CI : constantes SMIG/CNPS/CMU, fonctions `calculerBulletin()`, `calculerChargesPatronales()`, `calculerITS()`, `calculerPrimeAnciennete()`, `calculerIndemniteLicenciement()`, `calculerProvision13e()`
- `lib/utils.ts` — utilitaires généraux (`cn()` pour Tailwind, formatage FCFA)
- `lib/claude/index.ts` — client Anthropic SDK, constante `CLAUDE_MODEL`
- `lib/gemini/index.ts` — client Google Generative AI SDK, constante `GEMINI_FLASH`
- `lib/n8n/webhooks.ts` — `triggerN8n(path, payload)` — POST vers `N8N_BASE_URL/webhook/{path}` avec secret

### `types/`
- **Fichier :** `types/supabase.ts` — types TypeScript auto-générés depuis le schéma Supabase
- **Usage :** `Tables<'employees'>`, `TablesInsert<'contracts'>`, `TablesUpdate<'evaluations'>`
- **Helpers exportés :** `Tables<T>`, `TablesInsert<T>`, `TablesUpdate<T>`, `Enums<T>`, `CompositeTypes<T>`

### `scripts/`
- **But :** Migrations SQL à exécuter manuellement dans le SQL Editor Supabase
- **Fichiers :**

| Script | Description |
|---|---|
| `migration_securite.sql` | RLS sur toutes les tables, index performance, table `audit_logs` |
| `add_employee_fields.sql` | Champs étendus employé : civilité, nationalité, état civil, enfants, niveau étude, catégorie |
| `add_employee_primes.sql` | Primes rattachées au profil employé : sursalaire, prime_exceptionnelle, prime_transport, etc. |
| `add_bulletin_primes.sql` | Lignes 02-08 sur bulletins_paie + num_cnps employé |
| `add_salary_history.sql` | Table `employee_salary_history` avec RLS |
| `storage_rls.sql` | Politiques RLS sur les buckets Supabase Storage |
| `seed_legal_documents.sql` / `seed_legal_v2.sql` / `seed_legal_v3.sql` | Données initiales Code du Travail CI pour RAG |

### `skills/`
- **But :** Documentation de pilotage pour Claude Code — à lire avant de coder dans chaque domaine
- **Fichiers :** `skills/architecture/SKILL.md`, `skills/database/SKILL.md`, `skills/modules/SKILL.md`, `skills/workflows/SKILL.md`, `skills/ai-rag/SKILL.md`, `skills/forms/SKILL.md`, `skills/security/SKILL.md`

---

## Tables de la base de données

Les types TypeScript sont dans `types/supabase.ts`. Les tables non encore reflétées dans ce fichier (ajoutées par scripts) sont `bulletins_paie`, `conges`, `employee_salary_history`.

| Table | Colonnes principales | Relation multi-tenant |
|---|---|---|
| `companies` | `id`, `name`, `convention_collective` | Table racine |
| `profiles` | `id` (= auth.uid), `company_id`, `email`, `full_name`, `role` | `company_id → companies` |
| `employees` | `id`, `company_id`, `matricule`, `full_name`, `poste`, `departement`, `date_embauche`, `salaire_brut`, `type_contrat`, `statut`, `genre`, `manager_id`, `civilite`, `nationalite`, `etat_civil`, `nb_enfants`, `niveau_etude`, `categorie`, `num_cnps`, `sursalaire`, `prime_*` | `company_id → companies` |
| `contracts` | `id`, `company_id`, `employee_id`, `type_contrat`, `date_debut`, `date_fin`, `salaire_brut`, `renouvellement_count`, `statut`, `document_url` | `company_id`, `employee_id → employees` |
| `conges` | `id`, `company_id`, `employee_id`, `type`, `nb_jours`, `date_debut`, `date_fin`, `statut` | `company_id`, `employee_id → employees` |
| `bulletins_paie` | `id`, `company_id`, `employee_id`, `periode` (YYYY-MM), `salaire_brut`, `sursalaire`, `prime_anciennete`, `prime_exceptionnelle`, `prime_salissure`, `prime_depassement`, `prime_fonction`, `prime_transport`, `cnps_salarie`, `its`, `autres_retenues`, `avances`, `salaire_net`, `statut` | `company_id`, `employee_id → employees` |
| `employee_salary_history` | `id`, `company_id`, `employee_id`, `date_effet`, `salaire_brut`, `sursalaire`, `prime_*`, `motif` | `company_id`, `employee_id → employees` |
| `evaluations` | `id`, `company_id`, `employee_id`, `evaluateur_id`, `date_evaluation`, `periode`, `periodicite`, `scores` (JSON), `score_global`, `statut` | `company_id`, `employee_id → employees` |
| `candidates` | `id`, `company_id`, `job_id`, `full_name`, `email`, `phone`, `cv_url`, `statut`, `score_ia`, `score_detail` (JSON), `notes_rh` | `company_id`, `job_id → job_postings` |
| `job_postings` | `id`, `company_id`, `titre`, `description`, `type_contrat`, `competences` (array), `experience_min`, `salaire_min`, `salaire_max`, `date_limite`, `statut` | `company_id → companies` |
| `legal_cases` | `id`, `company_id`, `employee_id`, `reference`, `titre`, `type_cas`, `priorite`, `statut`, `date_ouverture`, `description` | `company_id`, `employee_id → employees` |
| `legal_documents` | `id`, `company_id` (nullable), `titre`, `source`, `contenu`, `embedding` (pgvector), `metadata` | Partagé (public) ou isolé |
| `notifications` | `id`, `company_id`, `user_id`, `type`, `titre`, `message`, `lu` | `company_id`, `user_id → profiles` |
| `documents` | `id`, `company_id`, `employee_id`, `name`, `famille`, `file_url`, `file_type`, `file_size_kb` | `company_id`, `employee_id → employees` |
| `audit_logs` | `id`, `company_id`, `user_id`, `action`, `resource`, `resource_id`, `details`, `created_at` | `company_id`, immuable |

**Fonctions Postgres disponibles :**
- `get_user_company_id()` — retourne le `company_id` de l'utilisateur connecté (utilisée dans toutes les RLS)
- `match_legal_documents(query_embedding, match_threshold, match_count, filter_company_id)` — recherche vectorielle pgvector

---

## Conventions de nommage des fichiers

| Type | Convention | Exemples |
|---|---|---|
| Pages Next.js | `page.tsx` (requis) | `app/(dashboard)/employes/page.tsx` |
| Layouts | `layout.tsx` (requis) | `app/(dashboard)/layout.tsx` |
| API Routes | `route.ts` (requis) | `app/api/employees/route.ts` |
| Composants React | PascalCase `.tsx` | `EmployeeDialog.tsx`, `KpiCard.tsx` |
| Hooks | camelCase préfixé `use` `.ts` | `useEmployeeData.ts` |
| Bibliothèques | camelCase `.ts` | `paie-ci.ts`, `utils.ts` |
| Tables Supabase | snake_case pluriel | `employees`, `bulletins_paie`, `legal_cases` |

---

## Où placer le nouveau code

**Nouveau module RH (ex: `formations`) :**
- Page : `app/(dashboard)/formations/page.tsx`
- API lecture : requête directe dans la page RSC via `createServerClient()`
- API mutations : `app/api/formations/route.ts` + `app/api/formations/[id]/route.ts`
- Composants : `components/rh/FormationDialog.tsx`, `components/rh/FormationTable.tsx`
- Navigation : ajouter dans `components/rh/SidebarNav.tsx` → tableau `navItems`
- Types : ajouter la table dans `types/supabase.ts` (ou régénérer depuis Supabase CLI)
- Migration SQL : `scripts/add_formations.sql` (avec RLS `company_id = get_user_company_id()`)

**Nouveau calcul de paie CI :**
- Ajouter la fonction dans `lib/paie-ci.ts`
- Importer dans `app/api/paie/route.ts`

**Nouveau composant UI de base :**
- Ajouter dans `components/ui/` en suivant le patron shadcn/ui
- Si `Input`-like : utiliser `React.forwardRef` obligatoirement

**Nouveau webhook n8n :**
- Utiliser `triggerN8n(path, payload)` depuis `lib/n8n/webhooks.ts`
- Documenter le webhook dans `skills/workflows/SKILL.md`

---

*Analyse structure : 2026-03-30*
