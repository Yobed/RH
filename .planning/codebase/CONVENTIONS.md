# Conventions de Code

**Date d'analyse :** 2026-03-30

---

## Nommage des fichiers

**Composants React :**

- PascalCase obligatoire → `EmployeeDialog.tsx`, `PaieDialog.tsx`, `KpiCard.tsx`
- Les dialogs CRUD portent le suffixe `Dialog` → `CongesDialog.tsx`, `ContractDialog.tsx`
- Les boutons d'action dédiés portent le suffixe `Button` → `PaieStatusButton.tsx`, `CongesApprovalButton.tsx`
- Localisation : `components/rh/` pour les composants métier, `components/ui/` pour les primitives UI

**Pages Next.js (App Router) :**

- Toutes en minuscules kebab-case via le dossier → `app/(dashboard)/employes/page.tsx`
- Routes groupées par layout → `(auth)` et `(dashboard)`
- Routes dynamiques avec crochets → `employes/[id]/page.tsx`, `paie/[id]/print/page.tsx`

**Routes API :**

- Dossier en minuscules, pluriel anglais → `app/api/employees/route.ts`, `app/api/legal-cases/route.ts`
- Exceptions en français pour les modules purement ivoiriens → `app/api/paie/route.ts`, `app/api/conges/route.ts`
- Sous-routes dynamiques → `app/api/employees/[id]/route.ts`

**Hooks :**

- camelCase préfixé `use` (non détectés dans la base actuelle, pattern attendu) → `useEmployeeData.ts`

**Librairies utilitaires :**

- camelCase en `lib/` → `lib/paie-ci.ts`, `lib/utils.ts`
- Sous-dossiers pour les clients tiers → `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/claude/index.ts`

**Tables Supabase :**

- snake_case pluriel → `employees`, `bulletins_paie`, `legal_cases`, `audit_logs`, `candidates`
- Colonnes snake_case → `company_id`, `full_name`, `salaire_brut`, `date_embauche`

---

## TypeScript

**Mode strict activé** dans `tsconfig.json` :

```json
{ "strict": true, "noEmit": true }
```

**Règle absolue :** `any` est interdit (CLAUDE.md). Utiliser `unknown` pour les corps de requête non validés :

```ts
// Correct — app/api/employees/route.ts
let body: unknown;
try { body = await req.json(); } catch { ... }
const parsed = createSchema.safeParse(body);
```

**Types Supabase générés :** utiliser `Tables<"nom_table">` depuis `types/supabase.ts` :

```ts
import type { Tables } from "@/types/supabase";
type Employee = Tables<"employees">;
type Employee = Pick<Tables<"employees">, "id" | "full_name" | "matricule" | "salaire_brut">;
```

**Types dérivés de Zod :** inférer le type du formulaire depuis le schéma :

```ts
const schema = z.object({ ... });
type FormData = z.infer<typeof schema>;
```

**Types locaux étendus :** intersections pour les champs supplémentaires non encore dans les types générés :

```ts
// components/rh/EmployeeDialog.tsx
type EmployeeWithPrimes = Employee & {
  civilite?: string | null;
  sursalaire?: number | null;
  // ...
};
```

**Interfaces pour les props :**

```ts
interface Props {
  employee?: EmployeeWithPrimes;
}
export function EmployeeDialog({ employee }: Props) { ... }
```

**`interface` vs `type` :** les deux sont utilisés — `interface` pour les props et formes de données, `type` pour les alias de `z.infer` et les `Pick`/intersections.

---

## Alias de chemin

Défini dans `tsconfig.json` :

```json
{ "paths": { "@/*": ["./*"] } }
```

Tous les imports locaux utilisent `@/` :

```ts
import { createServerClient } from "@/lib/supabase/server";
import { EmployeeDialog } from "@/components/rh/EmployeeDialog";
import type { Tables } from "@/types/supabase";
```

---

## Organisation des imports

Ordre observé dans les composants client :

1. Hooks React natifs (`useState`, `useEffect`)
2. Hooks Next.js (`useRouter`, `useForm`)
3. Librairies tierces (`zod`, `sonner`, `lucide-react`)
4. Composants UI internes (`@/components/ui/*`)
5. Types (`import type { Tables } from "@/types/supabase"`)

Ordre observé dans les routes API :

1. Client Supabase (`@/lib/supabase/server`)
2. Next.js (`NextResponse`)
3. Zod
4. Utilitaires métier (`@/lib/paie-ci`)

---

## Pattern composants

**Directive `"use client"` :** tous les composants Dialog et les composants avec état local la portent en première ligne. Les pages `(dashboard)` sont des Server Components par défaut.

**Composants Dialog (pattern CRUD standard) :**

```tsx
"use client";
// 1. Schéma Zod local
const schema = z.object({ ... });
type FormData = z.infer<typeof schema>;

// 2. Fonction de nettoyage payload
function cleanPayload(data: FormData): Record<string, unknown> { ... }

// 3. Composant exporté nommé (pas default)
export function XxxDialog({ entity }: Props) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: entity ? toFormDefaults(entity) : { ... },
  });

  async function onSubmit(data: FormData) {
    const url = entity ? `/api/xxx/${entity.id}` : "/api/xxx";
    const method = entity ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(cleanPayload(data)) });
    if (!res.ok) { toast.error(...); return; }
    toast.success(...);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>...</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Sections avec <section> + titre uppercase */}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>...</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Sections dans les formulaires longs :**

```tsx
<section className="space-y-3">
  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">
    Identité
  </p>
  {/* champs */}
</section>
```

**Affichage des erreurs de champ :**

```tsx
{errors.full_name && (
  <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
)}
```

**Bouton déclencheur Dialog avec @base-ui/react :**

```tsx
// Utiliser render={<Button />} — PAS asChild
<DialogTrigger render={<Button />}>Texte</DialogTrigger>
// Ou render={<Button variant="ghost" size="sm" />} pour l'édition
```

**Pages Server Component (pattern dashboard) :**

```tsx
export const dynamic = 'force-dynamic';
export const metadata = { title: "Module — RH Manager CI" };

export default async function XxxPage() {
  const supabase = createServerClient();
  const { data } = await supabase.from("xxx").select("...").order("...");
  return <div className="p-6 space-y-6">...</div>;
}
```

---

## Formulaires — react-hook-form + Zod

**Règle mémorisée :** pas de `.default()` dans le schéma Zod, utiliser `defaultValues` dans `useForm` :

```ts
// INTERDIT
const schema = z.object({ statut: z.string().default("actif") });

// CORRECT
useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { statut: "actif" },
});
```

**Champs numériques dans les formulaires :** stockés en `string` côté formulaire, convertis en `number` dans `cleanPayload` ou `onSubmit` :

```ts
// Dans le schéma formulaire (côté client)
salaire_brut: z.string().optional(),
// Dans cleanPayload
if (k === "salaire_brut") return [k, v ? Number(v) : null];
```

**Champs select natifs :** `<select {...register("champ")} className={selectClass}>` avec la constante CSS partagée au niveau du composant :

```ts
const selectClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ...";
```

**Input custom :** `components/ui/input.tsx` utilise `React.forwardRef` (obligatoire pour react-hook-form).

---

## Pattern routes API

**Structure standard de chaque route POST/PUT :**

```ts
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ ... });

export async function POST(req: Request) {
  const supabase = createServerClient(); // RLS actif via JWT

  // 1. Vérifier authentification
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // 2. Parser le body
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 }); }

  // 3. Valider avec Zod
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  // 4. Récupérer company_id via RPC
  const { data: companyId, error: companyError } = await supabase.rpc("get_user_company_id");
  if (companyError || !companyId) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });

  // 5. Insérer/mettre à jour avec company_id explicite
  const { data, error } = await supabase
    .from("table")
    .insert({ ...parsed.data, company_id: companyId as string })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

**RLS — règle absolue :** ne jamais utiliser la service role key. Utiliser uniquement `createServerClient()` (`lib/supabase/server.ts`) qui opère sous le JWT de l'utilisateur. Le RLS Supabase filtre automatiquement par `company_id`.

**Récupération `company_id` :** via `supabase.rpc("get_user_company_id")` (certaines routes) ou `supabase.from("profiles").select("company_id").eq("id", user.id).single()`.

**Gestion des conflits :** vérifier `error.code === "23505"` pour les doublons (unique constraint) et retourner 409.

---

## Devise et formatage monétaire

**Format FCFA XOF obligatoire :**

```ts
// Pattern standard — app/(dashboard)/paie/page.tsx
const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(n);

// Usage : fmt(150000) → "150 000 FCFA"
```

**Locale :** `"fr-CI"` (pas `"fr-FR"`).

**Montants dans les inputs :** `type="number"`, `min="0"`, `step="1000"` avec `placeholder="150 000"`.

**Labels de champ :** toujours indiquer l'unité entre parenthèses → `Salaire catégoriel (FCFA)`.

---

## Dates

**Timezone :** `Africa/Abidjan` (mentionné dans CLAUDE.md).

**Format d'affichage :** DD/MM/YYYY.

**Stockage en base :** format ISO `YYYY-MM-DD` (type `date` Postgres).

**Période de paie :** format `YYYY-MM` validé par regex dans les schémas Zod :

```ts
periode: z.string().regex(/^\d{4}-\d{2}$/, "Format YYYY-MM requis"),
```

**Inputs HTML :** `<Input type="date" {...register("date_embauche")} />` — le navigateur gère l'affichage selon la locale.

**Calcul d'ancienneté** (pattern `lib/paie-ci.ts`) :

```ts
const debut = new Date(dateEmbauche); // ISO string YYYY-MM-DD
const now = new Date();
let annees = now.getFullYear() - debut.getFullYear();
```

---

## Notifications et feedback

**Toast :** bibliothèque `sonner` uniquement :

```ts
import { toast } from "sonner";
toast.success("Employé ajouté");
toast.error(err.error ?? "Erreur serveur");
```

**Rafraîchissement après mutation :** `router.refresh()` (Next.js App Router) pour recharger les données Server Component sans rechargement complet.

---

## Commentaires

**Code métier :** commentaires JSDoc détaillés avec sources légales dans `lib/paie-ci.ts` :

```ts
/**
 * Calcul ITS — Barème CI Art. 116 CGI CI
 * ⚠️ Barème à vérifier avec Loi de Finances de l'année en cours
 */
```

**Sections de formulaire :** commentaires inline `{/* ── NOM SECTION ── */}` pour délimiter les zones.

**Constantes légales :** commentaires `// Source : Décret n°...` avec références officielles.

---

## Linting et formatage

**ESLint :** configuré via `eslint-config-next` (package.json). Aucun fichier `.eslintrc` ou `eslint.config.*` détecté à la racine — la configuration Next.js par défaut est active.

**Prettier :** non détecté. Aucun `.prettierrc` ni `prettier.config.*` présent.

**Scripts disponibles :**

```bash
npm run dev      # Développement local (next dev)
npm run build    # Build production (next build)
npm run start    # Démarrage production (next start)
npm run lint     # ESLint via next lint
```

**TypeScript :** `tsc --noEmit` via `tsconfig.json` (mode strict, pas d'émission).

---

*Analyse des conventions : 2026-03-30*
