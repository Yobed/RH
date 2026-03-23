# Script PowerShell — Crée tous les fichiers du projet SaaS RH
# Colle ce script dans ton terminal VS Code PowerShell et appuie sur Entrée

$base = Get-Location

# Créer les dossiers
New-Item -ItemType Directory -Force -Path "$base\skills\architecture" | Out-Null
New-Item -ItemType Directory -Force -Path "$base\skills\database" | Out-Null
New-Item -ItemType Directory -Force -Path "$base\skills\modules" | Out-Null
New-Item -ItemType Directory -Force -Path "$base\skills\workflows" | Out-Null
New-Item -ItemType Directory -Force -Path "$base\skills\ai-rag" | Out-Null
New-Item -ItemType Directory -Force -Path "$base\skills\forms" | Out-Null
New-Item -ItemType Directory -Force -Path "$base\skills\security" | Out-Null
New-Item -ItemType Directory -Force -Path "$base\skills\workflows\exports" | Out-Null

Write-Host "✅ Dossiers créés" -ForegroundColor Green

# ============================================================
# CLAUDE.md
# ============================================================
@'
# CLAUDE.md — SaaS RH Ivoirien
> Fichier de pilotage principal. Claude Code lit ce fichier en priorité absolue à chaque session.

## 🎯 Vision du projet
SaaS RH multi-tenant destiné aux entreprises ivoiriennes.
Droit applicable : **Code du Travail ivoirien + Conventions Collectives CI**.
Langue de l'interface : **Français**.
Devise : **FCFA (XOF)**.

## 📁 Structure des skills — lis ces fichiers avant de coder

| Fichier | Quand le lire |
|---|---|
| `skills/architecture/SKILL.md` | Avant TOUTE nouvelle fonctionnalité |
| `skills/database/SKILL.md` | Avant toute migration Supabase |
| `skills/modules/SKILL.md` | Avant de coder un module métier |
| `skills/workflows/SKILL.md` | Avant de créer un workflow n8n |
| `skills/ai-rag/SKILL.md` | Avant de toucher à l'agent RAG |
| `skills/forms/SKILL.md` | Avant de créer un formulaire |
| `skills/security/SKILL.md` | Avant tout endpoint API |

## 🛠️ Stack technique — NE PAS dévier sans approbation

```
Frontend  : Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
Backend   : Supabase (Postgres 15 + Auth + Storage + pgvector)
Automation: n8n (HF Space : yobed-n8n-supabase-claude.hf.space)
IA        : Claude API claude-sonnet-4-20250514
ORM       : Supabase client (pas de Prisma)
Deploy    : Vercel (frontend) + Supabase Cloud
```

## 📐 Conventions de code obligatoires

- Composants React : PascalCase → EmployeeCard.tsx
- Hooks : camelCase préfixé use → useEmployeeData.ts
- Tables Supabase : snake_case pluriel → employees, legal_cases
- Variables env : NEXT_PUBLIC_ pour le client, sans préfixe pour le serveur
- Langue interface : Français uniquement
- Devise : FCFA (XOF) — format Intl.NumberFormat fr-CI
- Dates : DD/MM/YYYY — timezone Africa/Abidjan

## 🔐 Règle multi-tenant absolue
Chaque table contient company_id UUID NOT NULL.
Chaque requête Supabase filtre par company_id via RLS.
Ne jamais faire une requête sans RLS active.

## 🚫 Interdictions strictes
- Ne jamais committer de clés API
- Ne jamais bypasser le RLS Supabase
- Ne jamais appeler Claude API depuis le client
- Ne jamais utiliser "any" en TypeScript
'@ | Out-File -FilePath "$base\CLAUDE.md" -Encoding UTF8

Write-Host "✅ CLAUDE.md créé" -ForegroundColor Green

# ============================================================
# skills/architecture/SKILL.md
# ============================================================
@'
# SKILL — Architecture SaaS RH
> Lis ce fichier avant toute nouvelle fonctionnalité.

## Stack
- Frontend : Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
- Backend  : Supabase (Postgres + Auth + Storage + pgvector)
- n8n      : https://yobed-n8n-supabase-claude.hf.space
- IA       : Claude API (server-side uniquement)

## Structure dossiers Next.js
```
app/
  (auth)/login, register
  (dashboard)/
    rh/
    contrats/
    recrutement/
    evaluations/
    contentieux/
    archives/
  api/
components/
  ui/        ← shadcn (ne pas modifier)
  rh/        ← composants métier
  forms/
lib/
  supabase/server.ts, client.ts
  n8n/webhooks.ts
  claude/index.ts
types/
skills/
```

## Pattern Server Component (défaut)
```tsx
// ✅ Correct — pas de "use client"
export default async function EmployeeList() {
  const supabase = createServerClient()
  const { data } = await supabase.from("employees").select("*")
  return <EmployeeTable data={data} />
}
```

## Pattern Route Handler API
```ts
// app/api/employees/route.ts
export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  const { data } = await supabase.from("employees").select("*")
  return NextResponse.json(data)
}
```

## Variables d'environnement
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
N8N_BASE_URL=https://yobed-n8n-supabase-claude.hf.space
N8N_WEBHOOK_SECRET=
```

## Commandes démarrage
```bash
npx create-next-app@latest . --typescript --tailwind --app
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @anthropic-ai/sdk react-hook-form @hookform/resolvers zod
npm install sonner lucide-react clsx tailwind-merge
npx shadcn@latest init
npx shadcn@latest add button input select textarea card badge table dialog
```
'@ | Out-File -FilePath "$base\skills\architecture\SKILL.md" -Encoding UTF8

Write-Host "✅ architecture/SKILL.md créé" -ForegroundColor Green

# ============================================================
# skills/database/SKILL.md
# ============================================================
@'
# SKILL — Base de données Supabase
> Lis ce fichier avant toute migration ou modification de schéma.

## Principes
1. RLS activé sur TOUTES les tables
2. company_id dans TOUTES les tables (multi-tenant)
3. Migrations dans supabase/migrations/
4. Types générés après chaque migration

## Migration initiale — SQL complet

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  convention_collective TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  role TEXT NOT NULL CHECK (role IN ("admin","rh","manager","employee")),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  matricule TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_naissance DATE,
  genre TEXT CHECK (genre IN ("M","F")),
  email TEXT,
  phone TEXT,
  poste TEXT NOT NULL,
  departement TEXT,
  date_embauche DATE NOT NULL,
  type_contrat TEXT CHECK (type_contrat IN ("CDI","CDD","Stage","Apprentissage")),
  salaire_brut NUMERIC(12,0),
  statut TEXT DEFAULT "actif" CHECK (statut IN ("actif","inactif","suspendu")),
  manager_id UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, matricule)
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  type_contrat TEXT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE,
  date_fin_essai DATE,
  salaire_brut NUMERIC(12,0) NOT NULL,
  renouvellement_count INTEGER DEFAULT 0,
  statut TEXT DEFAULT "actif",
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_id UUID REFERENCES employees(id),
  name TEXT NOT NULL,
  famille TEXT CHECK (famille IN ("Contrat","Diplômes","Paie","Médical","Congés","Disciplinaire","Formation","Autre")),
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_kb INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  evaluateur_id UUID REFERENCES employees(id),
  periodicite TEXT CHECK (periodicite IN ("mensuel","trimestriel","semestriel","annuel")),
  periode TEXT NOT NULL,
  date_evaluation DATE NOT NULL,
  scores JSONB NOT NULL DEFAULT "{}",
  score_global NUMERIC(4,2),
  statut TEXT DEFAULT "brouillon",
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  competences TEXT[],
  experience_min INTEGER,
  salaire_min NUMERIC(12,0),
  salaire_max NUMERIC(12,0),
  type_contrat TEXT,
  statut TEXT DEFAULT "ouvert",
  date_limite DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  job_id UUID REFERENCES job_postings(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cv_url TEXT,
  score_ia NUMERIC(5,2),
  score_detail JSONB,
  statut TEXT DEFAULT "nouveau",
  notes_rh TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE legal_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_id UUID REFERENCES employees(id),
  reference TEXT NOT NULL,
  type_cas TEXT,
  titre TEXT NOT NULL,
  description TEXT,
  date_ouverture DATE NOT NULL DEFAULT CURRENT_DATE,
  statut TEXT DEFAULT "ouvert",
  priorite TEXT DEFAULT "normale",
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  source TEXT NOT NULL,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT "{}",
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON legal_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT,
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## RLS — Activer sur toutes les tables
```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "isolation_company" ON employees
  USING (company_id = get_user_company_id());
```

## Commandes Supabase CLI
```bash
npx supabase init
npx supabase migration new init_saas_rh
npx supabase db push
npx supabase gen types typescript --project-id TON_ID > types/supabase.ts
```
'@ | Out-File -FilePath "$base\skills\database\SKILL.md" -Encoding UTF8

Write-Host "✅ database/SKILL.md créé" -ForegroundColor Green

# ============================================================
# skills/workflows/SKILL.md
# ============================================================
@'
# SKILL — Workflows n8n
> Lis ce fichier avant de créer ou modifier un workflow n8n.

## Config n8n
- URL : https://yobed-n8n-supabase-claude.hf.space
- API Key : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNjY3MjFmNy1iMDEwLTQyYWUtOGJkYS1mODExZjQ4M2UyYzAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOTI4MDJiODctY2I1OS00ZWIyLTg1NDktMTgxYTM3MjZkOWQ4IiwiaWF0IjoxNzc0MjA5NzA0fQ.SAktgazuX1Ci-aw0Sbri5_Q2Eg__KHHtROxFXdeoDZs

## Workflow 1 — Alertes Contrats (Cron 08h00 quotidien)
Détecter les CDD/essais expirant dans 30j, 15j, 7j, 1j et envoyer emails.

Nœuds : Schedule → Supabase Query → Loop → Send Email

SQL Query :
```sql
SELECT c.id, c.type_contrat, c.date_fin, e.full_name, e.email, e.poste,
  EXTRACT(day FROM c.date_fin - NOW()) AS jours_restants
FROM contracts c
JOIN employees e ON c.employee_id = e.id
WHERE c.statut = "actif"
  AND c.date_fin BETWEEN NOW() AND NOW() + INTERVAL "30 days"
ORDER BY c.date_fin ASC
```

## Workflow 2 — Ingestion RAG (Webhook POST /rag/ingest)
PDF → Extraction texte → Chunking 500 tokens → Embedding → pgvector

## Workflow 3 — Agent RAG Juridique (Webhook POST /rag/query)
Question → Embedding → pgvector search → Claude API → Réponse sourcée

Prompt Claude :
```
Tu es expert en droit du travail ivoirien.
CONTEXTE : {{contexte_rag}}
QUESTION : {{question}}
Réponds précisément, cite les articles de loi, indique si avis juridique externe nécessaire.
```

## Workflow 4 — Scoring CV (Webhook POST /recrutement/score-cv)
CV upload → Claude API scoring → Supabase update → Email si score >= 70

Prompt Claude :
```
Analyse ce CV pour le poste : {{titre}}
Compétences requises : {{competences}}
CV : {{cv_text}}
Réponds UNIQUEMENT en JSON :
{"score_global": 85, "detail": {"competences": 90, "experience": 80, "formation": 85}, "recommandation": "shortlist", "justification": "..."}
```

## Workflow 5 — Rappels Évaluations (Cron 1er du mois 09h00)
Créer évaluations dues + notifier managers par email

## Workflow 6 — Classification Documents (Webhook POST /documents/classify)
Nom fichier → Claude API → Famille détectée → Supabase update

## Appel depuis Next.js
```ts
// lib/n8n/webhooks.ts
export async function triggerN8n(path: string, payload: object) {
  const res = await fetch(`${process.env.N8N_BASE_URL}/webhook/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET!,
    },
    body: JSON.stringify(payload),
  })
  return res.json()
}
```
'@ | Out-File -FilePath "$base\skills\workflows\SKILL.md" -Encoding UTF8

Write-Host "✅ workflows/SKILL.md créé" -ForegroundColor Green

# ============================================================
# skills/ai-rag/SKILL.md
# ============================================================
@'
# SKILL — Agent IA & RAG Juridique
> Lis ce fichier avant de toucher à l'agent RAG ou au scoring CV.

## Architecture RAG
PDF (Code Travail CI, Conventions) → Chunking → Embedding → pgvector
Question RH → Embedding → Recherche cosinus → Claude → Réponse sourcée

## Route API — Agent RAG
```ts
// app/api/rag/query/route.ts
import Anthropic from "@anthropic-ai/sdk"
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { question } = await req.json()

  // Déclencher via n8n (qui gère embedding + recherche pgvector)
  const result = await fetch(`${process.env.N8N_BASE_URL}/webhook/rag/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  }).then(r => r.json())

  return NextResponse.json(result)
}
```

## Route API — Scoring CV
```ts
// app/api/recrutement/score-cv/route.ts
const message = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Analyse ce CV pour : ${job.titre}\nCompétences : ${job.competences}\nCV : ${cvText}\nRéponds en JSON : {"score_global": 0-100, "recommandation": "shortlist|refus"}`
  }]
})
```

## Fonction RPC Supabase (RAG search)
```sql
CREATE OR REPLACE FUNCTION match_legal_documents(
  query_embedding VECTOR(1536),
  filter_company_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, contenu TEXT, source TEXT, similarity FLOAT)
LANGUAGE SQL AS $$
  SELECT id, contenu, source, 1 - (embedding <=> query_embedding) AS similarity
  FROM legal_documents
  WHERE (company_id IS NULL OR company_id = filter_company_id)
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

## Documents à ingérer en priorité
1. Code du Travail CI (Loi 2015-532)
2. Convention Collective Interprofessionnelle CI
3. Décrets d application du Code du Travail
4. Règlement intérieur de l entreprise (par tenant)
'@ | Out-File -FilePath "$base\skills\ai-rag\SKILL.md" -Encoding UTF8

Write-Host "✅ ai-rag/SKILL.md créé" -ForegroundColor Green

# ============================================================
# skills/forms/SKILL.md
# ============================================================
@'
# SKILL — Formulaires RH
> Lis ce fichier avant de créer tout formulaire avec upload de documents.

## Stack
react-hook-form + zod + shadcn/ui + Supabase Storage

## Pattern upload fichier
```ts
// lib/supabase/storage.ts
export async function uploadDocument(file: File, bucket: string, path: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw new Error(`Upload échoué : ${error.message}`)
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

export function buildStoragePath(companyId: string, employeeId: string, famille: string, filename: string) {
  return `documents/${companyId}/${employeeId}/${famille}/${Date.now()}_${filename}`
}
```

## Formulaire upload document (pattern complet)
```tsx
const schema = z.object({
  name: z.string().min(2),
  famille: z.enum(["Contrat","Diplômes","Paie","Médical","Congés","Disciplinaire","Formation","Autre"]),
  file: z.instanceof(File)
    .refine(f => f.size <= 10 * 1024 * 1024, "Max 10 Mo")
    .refine(f => ["application/pdf","image/jpeg","image/png"].includes(f.type), "PDF, JPEG ou PNG")
})
```

## Familles de documents
Contrat | Diplômes | Paie | Médical | Congés | Disciplinaire | Formation | Autre

## Règles UX
- Validation temps réel (afficher erreurs en cours de saisie)
- Désactiver bouton submit pendant envoi
- Toast succès + redirection après soumission
- Taille max affichée clairement
- Formats acceptés affichés sous le champ

## Notifications toast
```ts
import { toast } from "sonner"
toast.success("Document enregistré")
toast.error("Erreur upload. Réessayez.")
```
'@ | Out-File -FilePath "$base\skills\forms\SKILL.md" -Encoding UTF8

Write-Host "✅ forms/SKILL.md créé" -ForegroundColor Green

# ============================================================
# skills/modules/SKILL.md
# ============================================================
@'
# SKILL — Modules Métier RH (Droit ivoirien)
> Lis ce fichier avant de coder la logique d un module RH.

## Module 1 — Contentieux
- Préavis CDI : 1 mois ouvriers, 3 mois cadres
- Indemnité licenciement : 1/12 salaire annuel × années ancienneté
- Délai saisine Inspection du Travail : 15 jours
- Prescription : 2 ans

```ts
function calculerIndemnite(salaireAnnuel: number, annees: number) {
  return Math.round((salaireAnnuel / 12) * annees)
}
```

## Module 2 — Contrats
- CDD : max 2 ans, renouvelable 2 fois max (CI)
- Période essai CDI : 1 mois ouvriers, 3 mois agents maîtrise, 6 mois cadres
- Au-delà 2 renouvellements CDD → CDI automatique
- Alertes : 30j, 15j, 7j, 1j avant expiration

```ts
function peutRenouvelerCDD(contrat: Contract) {
  if (contrat.renouvellement_count >= 2)
    return { possible: false, raison: "Doit être converti en CDI (droit ivoirien)" }
  return { possible: true }
}
```

## Module 3 — Archivage
Structure Storage : documents/{company_id}/{employee_id}/{famille}/
Familles : Contrat, Diplômes, Paie, Médical, Congés, Disciplinaire, Formation, Autre

## Module 4 — KPI Dashboard
- Effectif total, % femmes, turn-over, embauches 30j
- CDD expirant dans 30j
- Postes ouverts, délai moyen embauche
- Taux completion évaluations
- Cas contentieux ouverts

## Module 5 — Recrutement
États candidat : nouveau → en_cours → shortlist → entretien → offre → embauche / refus
Seuils scoring : >= 80 shortlist, >= 60 entretien, < 60 refus
Critères : Compétences 35%, Expérience 30%, Formation 20%, Adéquation 15%

## Module 6 — Évaluations
- Mensuel : Cron 0 9 1 * *
- Trimestriel : Cron 0 9 1 1,4,7,10 *
- Semestriel : Cron 0 9 1 1,7 *
- Annuel : Cron 0 9 1 12 *

Grille : >= 90 Exceptionnel, >= 75 Très satisfaisant, >= 60 Satisfaisant, >= 40 À améliorer, < 40 Insuffisant
'@ | Out-File -FilePath "$base\skills\modules\SKILL.md" -Encoding UTF8

Write-Host "✅ modules/SKILL.md créé" -ForegroundColor Green

# ============================================================
# skills/security/SKILL.md
# ============================================================
@'
# SKILL — Sécurité
> Lis ce fichier avant tout endpoint API ou accès données sensibles.

## Règles absolues

### 1. Clés API côté serveur uniquement
```ts
// ❌ INTERDIT
const anthropic = new Anthropic({ apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_KEY })
// ✅ CORRECT — dans app/api/*/route.ts uniquement
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```

### 2. Vérifier auth en premier dans chaque route
```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
```

### 3. Valider les entrées avec Zod
```ts
const schema = z.object({ full_name: z.string().min(2).max(100), email: z.string().email() })
const parsed = schema.safeParse(body)
if (!parsed.success) return NextResponse.json({ error: "Invalide" }, { status: 400 })
```

### 4. Ne jamais bypasser RLS
```ts
// ❌ INTERDIT — bypass RLS
createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
// ✅ CORRECT
createServerClient() // utilise JWT utilisateur, RLS actif
```

### 5. Valider webhooks n8n
```ts
const secret = req.headers.get("x-webhook-secret")
if (secret !== process.env.N8N_WEBHOOK_SECRET) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
```

## Audit log
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```
'@ | Out-File -FilePath "$base\skills\security\SKILL.md" -Encoding UTF8

Write-Host "✅ security/SKILL.md créé" -ForegroundColor Green

# ============================================================
# .env.example
# ============================================================
@'
# Copier vers .env.local et remplir — NE JAMAIS COMMITTER .env.local

NEXT_PUBLIC_SUPABASE_URL=https://TON_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

ANTHROPIC_API_KEY=sk-ant-...

N8N_BASE_URL=https://yobed-n8n-supabase-claude.hf.space
N8N_WEBHOOK_SECRET=ton_secret_fort_ici

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=RH Manager CI
'@ | Out-File -FilePath "$base\.env.example" -Encoding UTF8

Write-Host "✅ .env.example créé" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 INSTALLATION TERMINÉE !" -ForegroundColor Cyan
Write-Host ""
Write-Host "Structure créée :" -ForegroundColor Yellow
Get-ChildItem -Path $base -Recurse -Include "*.md","*.example" | ForEach-Object {
  Write-Host "  $($_.FullName.Replace($base.ToString(), "."))" -ForegroundColor White
}
Write-Host ""
Write-Host "👉 Prochaine étape — lance cette commande :" -ForegroundColor Yellow
Write-Host '   claude "Lis CLAUDE.md puis initialise le projet Next.js"' -ForegroundColor Cyan
