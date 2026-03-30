# Stack Technique

**Date d'analyse :** 2026-03-30

## Langages

**Principal :**
- TypeScript ^5.9.3 — tout le code frontend et backend (Next.js App Router)

**Secondaire :**
- SQL (PostgreSQL 15) — migrations dans `scripts/*.sql`

## Runtime

**Environnement :**
- Node.js (version gérée par Next.js 14)

**Gestionnaire de paquets :**
- npm (lockfile `package-lock.json` présent)

## Frameworks

**Core :**
- Next.js ^14.2.35 (App Router, RSC activé) — framework fullstack
  - Config : `next.config.mjs`
  - Redirection racine `/` → `/rh`
  - Images distantes : aucune configuration de domaine externe

**UI :**
- React ^18.3.1 — bibliothèque de composants
- React DOM ^18.3.1

**Build/Dev :**
- TypeScript strict mode activé (`tsconfig.json` → `"strict": true`)
- PostCSS ^8.5.8 (`postcss.config.mjs`)
- Autoprefixer ^10.4.27

**Tests :**
- Playwright ^1.58.2 (devDependency) — tests E2E (aucun fichier de spec trouvé à ce jour)

## UI / Composants

**shadcn/ui :**
- Version CLI : shadcn ^4.1.0
- Style : `base-nova`, couleur de base `neutral`, variables CSS activées
- Config : `components.json`
- Icônes : lucide-react ^0.577.0
- Composants instanciés dans `components/ui/` :
  - `badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `table.tsx`, `textarea.tsx`

**@base-ui/react ^1.3.0 :**
- Primitives UI bas niveau (complément shadcn)
- Utiliser `render={<Button />}` et non `asChild` (voir feedback_base_ui.md)

**Tailwind CSS ^3.4.19 :**
- Config : `tailwind.config.ts`
- Système de design via variables CSS HSL (`--primary`, `--background`, etc.)
- Plugin : `tailwindcss-animate ^1.0.7`, `tw-animate-css ^1.4.0`
- `tailwind-merge ^3.5.0` pour fusionner les classes conditionnelles

**Utilitaires de styles :**
- `clsx ^2.1.1` — construction conditionnelle de classes
- `class-variance-authority ^0.7.1` — variantes de composants
- Alias `cn()` centralisé dans `lib/utils.ts`

## Gestion de formulaires

**React Hook Form ^7.72.0 :**
- Résolveur Zod : `@hookform/resolvers ^5.2.2`
- Ne pas utiliser `.default()` dans les schémas Zod — utiliser `defaultValues` dans `useForm()` (voir feedback_zod_rhf.md)
- Les composants `Input` custom doivent utiliser `React.forwardRef` (voir feedback_input_forwardref.md)

**Zod ^3.25.76 :**
- Validation des schémas de formulaires et des payloads API (route handlers)

## Notifications / Toasts

**sonner ^2.0.7 :**
- Toasts non-intrusifs pour les feedbacks utilisateur

## Traitement de fichiers

**pdf-parse ^2.4.5 :**
- Extraction de texte depuis des PDF côté serveur (route `app/api/rag/upload/route.ts`)
- Runtime obligatoire : `export const runtime = "nodejs"` (incompatible Edge)

## Chemin d'alias TypeScript

| Alias | Résolution |
|-------|------------|
| `@/*` | `./` (racine du projet) |

Exemples : `@/lib/claude`, `@/components/ui/button`, `@/types/supabase`

## Outillage de développement

**Linting :**
- ESLint ^8.57.1 avec `eslint-config-next ^14.2.35`
- Commande : `npm run lint`

**Formatage :**
- Aucune configuration Prettier détectée (pas de `.prettierrc`)

**Scripts npm :**
```bash
npm run dev      # Serveur de développement Next.js
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # Lint ESLint
```

## Déploiement cible

**Frontend :** Vercel (mentionné dans `CLAUDE.md`)
**Base de données :** Supabase Cloud

## Règles de code imposées

- Jamais de `any` en TypeScript
- Jamais d'appel à Claude API depuis un Client Component
- Devise : `Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF' })`
- Dates : format `DD/MM/YYYY`, timezone `Africa/Abidjan`

---

*Analyse stack : 2026-03-30*
