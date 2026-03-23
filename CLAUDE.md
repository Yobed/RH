# CLAUDE.md — SaaS RH Ivoirien
> Fichier de pilotage principal. Claude Code lit ce fichier en priorité absolue à chaque session.

## Objectif du projet
SaaS RH multi-tenant destiné aux entreprises ivoiriennes.
Droit applicable : **Code du Travail ivoirien + Conventions Collectives CI**.
Langue de l'interface : **Français**.
Devise : **FCFA (XOF)**.

## Structure des skills — lire ces fichiers avant de coder

| Fichier | Quand le lire |
|---|---|
| `skills/architecture/SKILL.md` | Avant TOUTE nouvelle fonctionnalité |
| `skills/database/SKILL.md` | Avant toute migration Supabase |
| `skills/modules/SKILL.md` | Avant de coder un module métier |
| `skills/workflows/SKILL.md` | Avant de créer un workflow n8n |
| `skills/ai-rag/SKILL.md` | Avant de toucher à l'agent RAG |
| `skills/forms/SKILL.md` | Avant de créer un formulaire |
| `skills/security/SKILL.md` | Avant tout endpoint API |

## Stack technique — NE PAS dévier sans approbation

```
Frontend  : Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
Backend   : Supabase (Postgres 15 + Auth + Storage + pgvector)
Automation: n8n (HF Space : yobed-n8n-supabase-claude.hf.space)
IA        : Claude API claude-sonnet-4-20250514
ORM       : Supabase client (pas de Prisma)
Deploy    : Vercel (frontend) + Supabase Cloud
```

## Conventions de code obligatoires

- Composants React : PascalCase → EmployeeCard.tsx
- Hooks : camelCase préfixé use → useEmployeeData.ts
- Tables Supabase : snake_case pluriel → employees, legal_cases
- Variables env : NEXT_PUBLIC_ pour le client, sans préfixe pour le serveur
- Langue interface : Français uniquement
- Devise : FCFA (XOF) — format Intl.NumberFormat fr-CI
- Dates : DD/MM/YYYY — timezone Africa/Abidjan

## Règle multi-tenant absolue
Chaque table contient company_id UUID NOT NULL.
Chaque requête Supabase filtre par company_id via RLS.
Ne jamais faire une requête sans RLS active.

## Interdictions strictes
- Ne jamais committer de clés API
- Ne jamais bypasser le RLS Supabase
- Ne jamais appeler Claude API depuis le client
- Ne jamais utiliser "any" en TypeScript
