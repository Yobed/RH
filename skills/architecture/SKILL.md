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
// Correct — pas de "use client"
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
