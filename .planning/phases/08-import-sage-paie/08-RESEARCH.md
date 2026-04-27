# Phase 8: Import Paie Sage - Research

**Researched:** 2026-04-27
**Domain:** Excel file import pipeline (TypeScript) + Supabase table migration + drag-and-drop upload UX
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Route : `app/(dashboard)/paie/import-sage/page.tsx`
- Drag-and-drop zone pour upload du fichier Excel rempli
- Bouton "Télécharger le template" qui sert le fichier template Excel
- Cohérence visuelle avec les autres pages paie (`/paie`, `/paie/masse-salariale`)
- Langue : Français uniquement
- Template = fichier `.xlsx` avec colonnes : `Matricule/Nom`, `Salaire de base`, `Brut Social`, `Net A Payer`
- Seule la table `payroll_logs` est écrite — aucune autre table touchée
- Chaque ligne → entrée `payroll_logs` avec : `company_id`, `employee_id`, `base_salary`, `net_pay`, `import_source: 'sage'`, `imported_at: now()`, `imported_by: user.id`
- Colonnes requises pour validation : `Matricule/Nom`, `Salaire de base`, `Net A Payer`
- Validation côté serveur uniquement — jamais côté client
- Retour API : `{ success: true, imported: N, errors: [] }` ou `{ success: false, errors: [{row, message}] }`
- Implémentation en TypeScript (pas de Python/microservice séparé) — réécriture de la logique Python en TypeScript dans la Route Handler

### Claude's Discretion

- Gestion des doublons : avertissement si même période + même employé, mais pas de blocage
- Pagination ou limite sur le nombre de lignes importables simultanément

### Deferred Ideas (OUT OF SCOPE)

- Connexion directe API Sage Paie
- Support format CSV ou autres versions Sage
- Réconciliation automatique avec `pay_slips`
- Interface de matching `employee_id` Sage ↔ `id` employé SIRH
- Historique des imports avec possibilité de rollback
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ISP-01 | Page dédiée "Import Paie Sage" avec UX drag-and-drop et téléchargement de template de mapping | Pattern existant : `DocumentUploadDialog` (drag-and-drop natif), `MasseSalarialePage` (structure paie) |
| ISP-02 | Template de mapping téléchargeable (colonnes SIRH) que le RH remplit depuis son export Sage | Pattern existant : `GET /api/import/employees/template` génère un `.xlsx` en mémoire via `xlsx@0.18.5` |
| ISP-03 | Script de traitement : nettoyage espaces insécables, virgules décimales, mapping colonnes Sage → SIRH | Pattern existant : `parseSalary()` dans `/api/import/employees/route.ts` — logique identique |
| ISP-04 | Écriture dans `payroll_logs` uniquement avec traçabilité complète | Table `payroll_logs` absente — migration SQL à créer |
| ISP-05 | Validation du fichier avant import — erreur explicite si colonnes manquantes ou données incohérentes | Pattern existant : boucle de validation ligne par ligne dans `/api/import/employees/route.ts` |
</phase_requirements>

---

## Summary

La Phase 8 peut s'appuyer intégralement sur des patterns **déjà implémentés et testés** dans le projet. Il existe un précédent direct : `app/api/import/employees/` qui fait exactement ce que la phase demande (lecture xlsx, nettoyage des données, validation ligne par ligne, upsert Supabase). La bibliothèque `xlsx@0.18.5` est déjà installée. Le composant `DocumentUploadDialog` fournit un drag-and-drop fonctionnel réutilisable.

La table `payroll_logs` n'existe pas encore dans Supabase. Une migration SQL est le seul prérequis externe. La question architecturale "Python vs TypeScript" est résolue : la réécriture TypeScript est confirmée et triviale, car `parseSalary()` dans le code existant couvre exactement les mêmes cas (espaces insécables `\xa0`, séparateurs de milliers, virgules décimales).

L'`employee_id` dans `payroll_logs` sera stocké en `TEXT` (la valeur brute `Matricule/Nom` issue du fichier Sage, non résolu vers un UUID `employees.id`). Cette décision est cohérente avec la décision déférrée "interface de matching Sage ↔ SIRH". Le rapprochement avec `employees.matricule` sera assuré ultérieurement.

**Primary recommendation:** Copier et adapter le pattern `app/api/import/employees/` — c'est 80% du code déjà écrit.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `xlsx` | 0.18.5 | Lecture/écriture fichiers Excel | Déjà installé, utilisé dans `/api/import/employees` |
| `zod` | existant | Validation schéma API | Obligatoire par conventions projet |
| `next` | 14.2.35 | App Router + Route Handlers | Stack locked |
| `@supabase/supabase-js` | existant | Écriture `payroll_logs` via RLS | Stack locked |
| `sonner` | existant | Toasts feedback UX | Utilisé partout dans le projet |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | existant | Icônes (Upload, FileText, X, Check) | Composant drag-and-drop |
| shadcn/ui `Button`, `Card`, `Badge` | existant | UI cohérente avec les autres pages paie | Toujours |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `xlsx` (déjà installé) | `exceljs` | exceljs n'est pas installé — éviter d'ajouter une dépendance |
| Route Handler TypeScript | Python microservice / n8n | Python non natif sur Vercel ; n8n ajoute de la latence ; TypeScript couvre 100% des besoins |
| Fichier `.xlsx` statique dans `/public` | Génération dynamique via Route Handler | La génération dynamique permet de mettre à jour le template sans redéploiement — pattern déjà utilisé dans `/api/import/employees/template` |

**Installation:** Aucune installation requise. `xlsx` est déjà une dépendance du projet.

---

## Architecture Patterns

### Recommended Project Structure

```
app/
  (dashboard)/
    paie/
      import-sage/
        page.tsx              # Server Component shell + Client import
  api/
    paie/
      import-sage/
        route.ts              # POST — traitement + écriture payroll_logs
        template/
          route.ts            # GET — génère et sert le .xlsx template
components/
  paie/
    SageImportDropzone.tsx    # "use client" — drag-and-drop + appel API
supabase/
  migrations/
    20260427000000_payroll_logs.sql
```

### Pattern 1: Génération du Template Excel (Route Handler GET)

**What:** La Route Handler génère un fichier `.xlsx` en mémoire et le retourne avec les bons headers HTTP.
**When to use:** Toujours — pattern confirmé par `GET /api/import/employees/template/route.ts`.

```typescript
// app/api/paie/import-sage/template/route.ts
// Source: app/api/import/employees/template/route.ts (pattern existant)
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { header: "Matricule/Nom", example: "EMP001 - KOFFI Jean" },
  { header: "Salaire de base", example: "350000" },
  { header: "Brut Social", example: "380000" },
  { header: "Net A Payer", example: "295000" },
];

export async function GET() {
  const wb = XLSX.utils.book_new();

  const headers = COLUMNS.map((c) => c.header);
  const example = COLUMNS.map((c) => c.example);
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = COLUMNS.map(() => ({ wch: 25 }));

  XLSX.utils.book_append_sheet(wb, ws, "Paie Sage");

  // Feuille 2 : instructions
  const instructions = [
    ["Instructions", ""],
    ["1. Exportez votre livre de paie depuis Sage Paie"],
    ["2. Copiez-collez vos données dans les colonnes ci-dessus"],
    ["3. Sauvegardez et importez ce fichier dans le SIRH"],
    ["Note:", "La colonne 'Brut Social' est optionnelle"],
  ];
  const wsInst = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInst, "Instructions");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="template-import-sage.xlsx"',
    },
  });
}
```

### Pattern 2: Traitement du fichier importé (Route Handler POST)

**What:** Reçoit `multipart/form-data`, lit le fichier xlsx, valide, nettoie les données, écrit dans `payroll_logs`.
**When to use:** Point d'entrée unique pour l'import.

```typescript
// app/api/paie/import-sage/route.ts
// Source: adapté de app/api/import/employees/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

// Réimplémentation TypeScript de la logique Python fournie
function parseNumericFR(val: unknown): number | null {
  if (typeof val === "number") return val;
  if (!val) return null;
  // Supprime espaces insécables (\xa0), espaces ordinaires, séparateurs
  let s = String(val).replace(/[\s  ]/g, "");
  // Convertit la virgule décimale en point
  s = s.replace(",", ".");
  // Gestion milliers avec points (ex: 1.500.000)
  const parts = s.split(".");
  if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
    s = parts.join("");
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

const REQUIRED_COLUMNS = ["Matricule/Nom", "Salaire de base", "Net A Payer"];

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile?.company_id)
    return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  if (rows.length === 0)
    return NextResponse.json({ error: "Fichier vide" }, { status: 400 });

  // Vérification colonnes requises
  const firstRow = rows[0];
  for (const col of REQUIRED_COLUMNS) {
    if (!(col in firstRow)) {
      return NextResponse.json(
        { success: false, errors: [{ row: 0, message: `Colonne '${col}' manquante dans le fichier importé. Vérifiez que vous avez utilisé le template fourni.` }] },
        { status: 422 }
      );
    }
  }

  // Validation ligne par ligne
  const errors: Array<{ row: number; message: string }> = [];
  const toInsert: Record<string, unknown>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 car ligne 1 = headers
    const employeeId = String(row["Matricule/Nom"] ?? "").trim();
    const baseSalary = parseNumericFR(row["Salaire de base"]);
    const netPay = parseNumericFR(row["Net A Payer"]);

    if (!employeeId) {
      errors.push({ row: rowNum, message: `Ligne ${rowNum}: Matricule/Nom vide` });
      continue;
    }
    if (baseSalary === null) {
      errors.push({ row: rowNum, message: `Ligne ${rowNum}: 'Salaire de base' non numérique` });
      continue;
    }
    if (netPay === null) {
      errors.push({ row: rowNum, message: `Ligne ${rowNum}: 'Net A Payer' non numérique` });
      continue;
    }

    toInsert.push({
      company_id: profile.company_id,
      employee_id: employeeId,
      base_salary: baseSalary,
      net_pay: netPay,
      import_source: "sage",
      imported_at: new Date().toISOString(),
      imported_by: user.id,
    });
  }

  // Si des erreurs : aucune écriture
  if (errors.length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 422 });
  }

  const { error: insertError } = await supabase
    .from("payroll_logs")
    .insert(toInsert);

  if (insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ success: true, imported: toInsert.length, errors: [] });
}
```

### Pattern 3: Composant Drag-and-Drop Client

**What:** Composant client autonome, reprend exactement le pattern de `DocumentUploadDialog`.
**When to use:** Toujours — pas de bibliothèque externe nécessaire, HTML natif suffit.

```tsx
// components/paie/SageImportDropzone.tsx
// Source: adapté de components/rh/DocumentUploadDialog.tsx
"use client";
// handleDrop, onDragOver, fileRef — pattern identique à DocumentUploadDialog
// Appel fetch("POST /api/paie/import-sage", { FormData })
// Affichage résultat : succès N lignes importées, ou liste des erreurs
```

### Pattern 4: Page Server Component Shell

**What:** La page est un Server Component qui rend le composant client.
**When to use:** Toujours — convention App Router du projet.

```tsx
// app/(dashboard)/paie/import-sage/page.tsx
// Pas de "use client" sur la page — le client est isolé dans SageImportDropzone
export default function ImportSagePage() {
  return (
    <div>
      {/* Header cohérent avec /paie et /paie/masse-salariale */}
      <SageImportDropzone />
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Ne pas parser le fichier côté client** : tout le traitement se fait dans la Route Handler. Le client envoie le fichier brut en `FormData`.
- **Ne pas utiliser `header: 7`** (le paramètre Python du script client) : le template SIRH a les colonnes en ligne 1. `header: 7` était pour parser directement l'export Sage natif — ce n'est pas le cas ici car l'utilisateur copie dans le template.
- **Ne pas bypasser RLS** : `createServerClient()` uniquement, jamais `SUPABASE_SERVICE_ROLE_KEY` pour l'insert.
- **Ne pas écrire partiellement** : si un seul `errors.length > 0`, retourner sans aucun insert (transaction atomique applicative).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Lecture/écriture Excel | Parser maison | `xlsx@0.18.5` (déjà installé) | Gère dates Excel, encodages, feuilles multiples |
| Nettoyage numérique | Regex ad hoc | `parseNumericFR()` — pattern déjà dans le projet | Couvre `\xa0`, `,`, milliers avec points |
| Drag-and-drop | Bibliothèque externe (react-dropzone) | HTML natif `onDrop` / `onDragOver` | Pattern déjà fonctionnel dans `DocumentUploadDialog` |
| Génération template | Fichier `.xlsx` statique dans `/public` | Route Handler GET + `xlsx.write()` | Mises à jour sans redéploiement ; pattern déjà utilisé |
| Validation colonnes | Code custom | Boucle `for...of REQUIRED_COLUMNS` + `in firstRow` | Simple et suffisant |

**Key insight:** 80% du code de cette phase est déjà dans `app/api/import/employees/`. La phase consiste à adapter ce pattern vers `payroll_logs`, pas à créer from scratch.

---

## Runtime State Inventory

> Phase greenfield sur une nouvelle table — pas de renommage/refactoring.

**Step 2.5: SKIPPED** — Cette phase crée une nouvelle table et de nouveaux fichiers. Aucun état runtime existant à inventorier.

---

## Common Pitfalls

### Pitfall 1: `header: 7` du script Python client

**What goes wrong:** Le script Python fourni utilise `pd.read_excel(file_path, header=7)` — ce qui signifie que les colonnes sont à la ligne 8 dans le fichier Sage natif. Dans notre cas, l'utilisateur copie ses données dans le **template SIRH** qui a ses colonnes en **ligne 1**.
**Why it happens:** Confusion entre "parser l'export Sage directement" vs "parser le template SIRH rempli".
**How to avoid:** Utiliser `XLSX.utils.sheet_to_json()` sans paramètre `header` — la première ligne du template SIRH est toujours la ligne des en-têtes.
**Warning signs:** `rows[0]` ne contient pas les colonnes attendues — colonnes nommées `__EMPTY`, `__EMPTY_1`, etc.

### Pitfall 2: Espaces insécables dans les montants Sage

**What goes wrong:** Sage Paie utilise ` ` (espace insécable) et ` ` (espace fine insécable) comme séparateurs de milliers. `parseFloat("350 000")` retourne `NaN`.
**Why it happens:** Ces caractères sont invisibles dans un éditeur mais présents dans les cellules copiées depuis Sage.
**How to avoid:** `s.replace(/[\s  ]/g, "")` avant `parseFloat()`. Voir `parseNumericFR()` dans le pattern ci-dessus.
**Warning signs:** Les montants valides retournent `null` dans la validation.

### Pitfall 3: Virgule décimale française

**What goes wrong:** `"1 234,56"` est un montant valide en France/CI. `parseFloat("1234,56")` retourne `1234` (tronqué).
**Why it happens:** `parseFloat` ne reconnaît que le point comme séparateur décimal.
**How to avoid:** `s.replace(",", ".")` après suppression des espaces.
**Warning signs:** Montants avec centimes tronqués silencieusement.

### Pitfall 4: `employee_id` TEXT vs UUID

**What goes wrong:** Tenter de faire une FK `payroll_logs.employee_id REFERENCES employees(id)` alors que la valeur issue de Sage est un texte libre (`"EMP001 - KOFFI Jean"`), pas un UUID.
**Why it happens:** Confusion entre l'`id` UUID de la table `employees` et le `matricule` TEXT.
**How to avoid:** `employee_id` dans `payroll_logs` est `TEXT NOT NULL` — pas une FK vers `employees`. Le rapprochement est déféré (hors scope).
**Warning signs:** Erreur Postgres `invalid input syntax for type uuid`.

### Pitfall 5: Doublons d'import

**What goes wrong:** Un RH importe deux fois le même fichier — 2× les lignes dans `payroll_logs` sans avertissement.
**How to avoid:** Ajouter une contrainte `UNIQUE(company_id, employee_id, import_source, imported_at::date)` ou implémenter un avertissement côté API si des entrées récentes existent pour les mêmes employés. Decision belongs to Claude's discretion — recommandation : contrainte UNIQUE sur `(company_id, employee_id, periode)` avec champ `periode TEXT` à ajouter à la table.
**Warning signs:** Doublon silencieux — pas d'erreur mais données faussées.

### Pitfall 6: Fichier xlsx avec feuilles multiples

**What goes wrong:** L'utilisateur enregistre le fichier et une 2ème feuille est sélectionnée par défaut.
**Why it happens:** `wb.SheetNames[0]` est correct mais vaut mieux le documenter.
**How to avoid:** Toujours lire `wb.Sheets[wb.SheetNames[0]]` — première feuille uniquement. Nommer la feuille explicitement dans le template ("Paie Sage") pour guider l'utilisateur.

---

## Code Examples

### Nettoyage numérique complet (TypeScript)

```typescript
// Source: adapté de app/api/import/employees/route.ts (parseSalary)
// Couvre : espaces insécables \xa0/ , virgules décimales, séparateurs milliers
function parseNumericFR(val: unknown): number | null {
  if (typeof val === "number") return isNaN(val) ? null : val;
  if (!val) return null;
  let s = String(val).replace(/[\s  ]/g, ""); // espaces insécables
  s = s.replace(",", ".");                                // virgule décimale
  const parts = s.split(".");
  // Si format 1.500.000 (milliers avec points)
  if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
    s = parts.join("");
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
```

### Migration SQL payroll_logs

```sql
-- supabase/migrations/20260427000000_payroll_logs.sql
CREATE TABLE payroll_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_id TEXT NOT NULL,          -- matricule/nom brut Sage (pas de FK UUID)
  base_salary NUMERIC(14, 2),
  net_pay NUMERIC(14, 2),
  periode TEXT,                       -- YYYY-MM optionnel pour détection doublons
  import_source TEXT NOT NULL DEFAULT 'sage',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  imported_by UUID REFERENCES auth.users(id)
);

ALTER TABLE payroll_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "isolation_company" ON payroll_logs
  USING (company_id = get_user_company_id());

-- Index performance
CREATE INDEX idx_payroll_logs_company_period
  ON payroll_logs(company_id, periode);
```

### Ajout de la navigation dans SidebarNav

```tsx
// components/rh/SidebarNav.tsx — ajouter dans le groupe Paie
{ label: "Import Paie Sage", href: "/paie/import-sage", icon: Upload }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fichier statique `/public/templates/` | Route Handler GET + génération en mémoire | Déjà en place (employees template) | Template mis à jour sans redéploiement |
| Python pandas pour parsing Excel | `xlsx` TypeScript dans Route Handler | Décision Phase 8 | Zéro dépendance externe, natif Vercel |

**Deprecated/outdated:**
- Script Python `process_sage_import()` : remplacé par `parseNumericFR()` TypeScript dans la Route Handler. La logique est identique, la plateforme (Vercel) ne supporte pas Python nativement dans Next.js.

---

## Open Questions

1. **Champ `periode` dans `payroll_logs`**
   - What we know: La migration proposée inclut un champ `periode TEXT` optionnel (ex: `2026-04`) pour permettre la détection de doublons et la traçabilité mensuelle.
   - What's unclear: Le RH devra-t-il saisir la période manuellement dans l'UI, ou est-elle automatiquement inférée comme le mois en cours ?
   - Recommendation: Ajouter un sélecteur de période dans l'UI (mois/année) avec défaut = mois en cours. Simple à implémenter, critique pour la traçabilité.

2. **Résolution `Matricule/Nom` → `employees.id`**
   - What we know: Le champ `employee_id` dans `payroll_logs` sera stocké comme TEXT brut (valeur Sage). La décision de résolution est déférrée.
   - What's unclear: Sage peut exporter `"EMP001"` ou `"EMP001 - KOFFI Jean"` selon la version. Le mapping n'est pas normalisé.
   - Recommendation: Stocker la valeur brute exactement telle qu'elle apparaît dans le fichier. Documenter ce choix dans l'UI ("Le matricule Sage sera affiché tel quel").

3. **Limite du nombre de lignes importables**
   - What we know: `xlsx@0.18.5` charge tout le fichier en mémoire sur Vercel (limite 4.5 MB par payload sur Vercel Hobby).
   - What's unclear: Taille typique d'un livre de paie CI (généralement < 500 employés = fichier < 100 KB).
   - Recommendation: Limite applicative à 1000 lignes avec message d'erreur explicite. Pas de pagination nécessaire pour v1.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `xlsx` npm package | ISP-02, ISP-03 | ✓ | 0.18.5 | — |
| Supabase `payroll_logs` table | ISP-04 | ✗ | — | Migration SQL à créer (Wave 0) |
| `vitest` | Tests | ✓ | 4.1.2 | — |
| Vercel (déploiement) | Production | ✓ | — | — |
| Python / pandas | ISP-03 | ✗ | — | TypeScript (décision locked) |

**Missing dependencies with no fallback:**
- Table `payroll_logs` — bloque ISP-04. Migration SQL obligatoire en Wave 0.

**Missing dependencies with fallback:**
- Python/pandas : fallback = TypeScript. Décision architecturale confirmée.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (racine du projet) |
| Quick run command | `npm test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ISP-03 | `parseNumericFR` nettoie `\xa0`, `,`, milliers | unit | `npm test -- --grep parseNumericFR` | ❌ Wave 0 |
| ISP-05 | Retourne erreur si colonne manquante | unit | `npm test -- --grep payroll_logs` | ❌ Wave 0 |
| ISP-05 | Retourne erreur si montant non numérique | unit | `npm test -- --grep parseNumericFR` | ❌ Wave 0 |
| ISP-04 | Aucune écriture si erreurs présentes | integration | Manuel (pas d'env test Supabase) | ❌ Wave 0 |

### Sampling Rate

- **Par tâche commit:** `npm test` (suite complète, < 10s)
- **Par wave merge:** `npm run test:coverage`
- **Phase gate:** Suite verte avant `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `lib/__tests__/paie-sage-import.test.ts` — couvre ISP-03, ISP-05 (fonctions pures testables sans Supabase)
- [ ] Migration SQL `payroll_logs` — prérequis à tout test d'intégration

---

## Sources

### Primary (HIGH confidence)

- Code existant `app/api/import/employees/route.ts` — pattern XLSX import complet
- Code existant `app/api/import/employees/template/route.ts` — pattern génération template
- Code existant `components/rh/DocumentUploadDialog.tsx` — pattern drag-and-drop natif
- `types/supabase.ts` — structure table `employees` (matricule TEXT, id UUID)
- `package.json` — `xlsx@0.18.5` installé, `vitest@4.1.2`
- `skills/database/SKILL.md` — patterns migration RLS Supabase
- `skills/security/SKILL.md` — règles auth Route Handler

### Secondary (MEDIUM confidence)

- CONTEXT.md Phase 8 — décisions architecturales (TypeScript vs Python)
- STATE.md — décisions historiques du projet (immutabilité, patterns audit)

### Tertiary (LOW confidence)

- Aucune source LOW confidence utilisée.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — bibliothèques vérifiées dans `package.json` et code existant
- Architecture patterns: HIGH — patterns copiés/adaptés de code production existant dans le projet
- Pitfalls: HIGH — basés sur le code source du précédent import (`parseSalary`) et la logique Python du client
- Migration SQL: HIGH — pattern identique aux 10 migrations existantes dans `supabase/migrations/`

**Research date:** 2026-04-27
**Valid until:** Stable — dépend uniquement de `xlsx@0.18.5` (API stable depuis v0.18) et des patterns internes du projet
