# SKILL — Sécurité
> Lis ce fichier avant tout endpoint API ou accès données sensibles.

## Règles absolues

### 1. Clés API côté serveur uniquement
```ts
// INTERDIT
const anthropic = new Anthropic({ apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_KEY })
// CORRECT — dans app/api/*/route.ts uniquement
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
// INTERDIT — bypass RLS
createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
// CORRECT
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
