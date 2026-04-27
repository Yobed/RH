# Phase 4: Dossier Personnel & Cycle Contractuel — Research

**Researched:** 2026-04-27
**Domain:** GED, PDF generation (jsPDF), career tracking, contract alerting
**Confidence:** HIGH — all findings verified from direct codebase inspection

---

## Summary

Phase 4 builds on an already well-prepared codebase. Several components are **already implemented** and merely need extension or wiring, not creation from scratch. The three most significant discoveries are:

1. The `career_events` table does NOT exist in any migration or in `types/supabase.ts`, despite the UI components (`CareerTimeline`, `CareerEventDialog`, `/api/career-events`) already being coded. The employee detail page already queries `supabase.from("career_events")`, meaning the page crashes silently (returns empty) until the migration is created. Plan 04-03 must start with the SQL migration.

2. PDF generation is entirely solved. `lib/pdf-templates.ts` already exports `generateAttestationPDF` (travail + salaire) using jsPDF 4.x + jspdf-autotable 5.x. `AttestationButton` and `DocumentDropdown` already call it client-side. Plan 04-02 must decide: keep pure client-side generation (current pattern) or add a server-side endpoint. Based on the existing pattern, pure client-side is the right choice — no new endpoint needed.

3. The notification system (`POST /api/notifications/sync`) already handles CDD expiry alerts (1/7/15/30 days) AND trial period end (10 days). Plan 04-04 only needs to: add `salaire_avant`/`salaire_apres` to `career_events`, add an avenant renewal form inside `ContractDialog`, and verify the existing sync covers the correct thresholds (30/15/7 days specified in requirements — currently the sync does 1/7/15/30 which already includes 7/15/30).

**Primary recommendation:** Plan wave order is 04-01 (no migration needed) → 04-03 (migration first, then timeline) → 04-02 (attestation button placement on fiche employé) → 04-04 (avenant form + notification verification). Plans 04-01 and 04-03's migration can run in the same wave.

---

## Project Constraints (from CLAUDE.md)

- Stack locked: Next.js 14 App Router + TypeScript + Supabase (no Prisma) + Tailwind + shadcn/ui
- Multi-tenant: every table needs `company_id UUID NOT NULL`, every query filtered via RLS
- No `any` in TypeScript
- Interface language: French only
- Currency: FCFA (XOF) — `Intl.NumberFormat fr-CI`
- Dates: DD/MM/YYYY — timezone Africa/Abidjan
- No direct Claude API calls from client
- No API keys committed to git

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOS-01 | Rangement et classement des documents du personnel (GED légère) | `/archives` page already functional with pagination + famille filter. `documents` table has `famille` column. `DocumentUploadDialog` has all 14 famille values. Extension only needed. |
| DOS-02 | Génération automatique d'attestation de travail | `generateAttestationPDF({type:'travail'})` already in `lib/pdf-templates.ts`. `DocumentDropdown` calls it from employee page. `AttestationButton` component exists. Needs accessibility from fiche employé GED tab. |
| DOS-03 | Génération automatique d'attestation de salaire | Same as DOS-02 — `generateAttestationPDF({type:'salaire'})` already implemented. |
| DOS-04 | Suivi de carrière (promotions, mutations, formations, avenants) | `CareerTimeline` + `CareerEventDialog` + `POST /api/career-events` all exist. Missing: SQL migration for `career_events` table + `types/supabase.ts` update. |
| DOS-05 | Gestion des renouvellements et avenants contractuels avec alertes | `ContractDialog` handles CDD with renouvellement_count. `notifications/sync` already fires for CDD expiry at 1/7/15/30 days. Missing: avenant/renewal form addition to ContractDialog. |

---

## 1. GED Légère (Plan 04-01)

### Current State

The `/archives` page (`app/(dashboard)/archives/page.tsx`) is already a full-featured GED:

- **Pagination**: Already implemented with `ITEMS_PER_PAGE = 10`, `offset`, `.range()`, `totalPages`, and full Previous/Next UI. The "replace .limit(20)" mentioned in the roadmap is **already done**.
- **Search by name**: Already implemented via `searchParams.q` → `.ilike("name", "%q%")`.
- **Filter by famille**: Already implemented via `searchParams.famille`.
- **Filter by employee**: Already implemented via `searchParams.employeeId`.
- **Familie classification**: 14 families defined (`Contrat`, `Avenant`, `Diplômes`, `CNI / Passeport`, `Extrait de naissance`, `Casier judiciaire`, `CV`, `Paie`, `Médical`, `Congés`, `Disciplinaire`, `Demande d'explication`, `Formation`, `Autre`).
- **Stats cards**: Per-famille count displayed in header row.
- **Delete**: `DocumentDeleteButton` component exists.

### `documents` Table Schema (from `types/supabase.ts`)

```typescript
{
  id: string
  company_id: string          // RLS key
  employee_id: string | null  // nullable = company-wide documents
  name: string
  famille: string | null
  file_type: string | null    // MIME type e.g. "application/pdf"
  file_size_kb: number | null
  file_url: string            // Supabase Storage URL
  created_at: string | null
}
```

### What Plan 04-01 Actually Needs to Do

The archives page is functionally complete. What the fiche employé GED tab lacks:

1. The GED tab in `app/(dashboard)/employes/[id]/page.tsx` shows documents but has NO search/filter UI (it displays raw `documents` array fetched at page load with no filtering).
2. The `REQUIS` conformité list uses hardcoded famille strings that differ from the upload dialog (e.g., "CNI / Passeport" vs "CNI / Passeport" — these match, but "Contrat" and "CV" need to match upload values).
3. The roadmap says to add famille classification with the 7 new families specified in the plan: `contrat, avenant, bulletin, attestation, disciplinaire, médical, autre`. The `DocumentUploadDialog` already has 14 families — the plan should align families between the two UIs.

**Confirmed**: The `/archives` global page is complete. Plan 04-01 work is on the **fiche employé GED tab**: add search+filter within the tab, ensure the famille badge uses consistent colours, and add `attestation` as a famille option in `DocumentUploadDialog`.

### Key Finding

The `ArchivesControls` client component handles URL-driven filter state for the `/archives` page. The fiche employé page uses server-side data loaded once — to add filtering, either use a separate client component that filters in-memory (fine for < 50 docs per employee), or pass `searchParams` through. Given low per-employee doc count, in-memory client-side filtering is simpler and preferred.

---

## 2. Génération PDF d'Attestations (Plan 04-02)

### Current State — Already Implemented

**Library**: `jsPDF 4.2.1` + `jspdf-autotable 5.0.7` — already installed.

**`lib/pdf-templates.ts`** already exports:
- `generateAttestationPDF({ employee, company, type: 'travail' | 'salaire' })` — complete implementation with company letterhead (raison_sociale, adresse, ncc, cnps_matricule), employee data (full_name, poste, date_embauche, salaire_brut), FCFA formatting.
- `exportPDF(doc, fileName)` — saves the PDF via `doc.save()`.
- `CompanyInfo` interface exported.

**`components/rh/AttestationButton.tsx`** — client component calling `generateAttestationPDF` directly, no server round-trip.

**`components/rh/DocumentDropdown.tsx`** — dropdown menu on the employee detail hero header with "Attestation de Travail" and "Attestation de Salaire" menu items. Already placed on the fiche employé page.

### What the Plan Actually Needs

The attestations are already callable from `DocumentDropdown` on the employee page hero. The roadmap says "téléchargement direct depuis la fiche employé" — this is **already implemented**.

The remaining gap is that the GED tab does not prominently expose attestation generation. Plan 04-02 should:
1. Add dedicated `AttestationButton` components in the GED tab (not just the dropdown) for visibility.
2. Optionally archive the generated PDF to Supabase Storage and insert a `documents` row after generation (so the document appears in the GED). Currently generation is local-only (no archiving).
3. **No server endpoint needed** — client-side jsPDF generation is fast and already works.

### `CompanyInfo` interface used by templates

```typescript
interface CompanyInfo {
  id: string
  name: string
  raison_sociale?: string | null
  adresse?: string | null
  ncc?: string | null
  cnps_matricule?: string | null
  convention_collective?: string | null
  logo_url?: string | null
}
```

The employee detail page already queries `companies` with `.select("*")` and passes it to `DocumentDropdown`.

### Decision: Client-side vs. Server-side PDF

The codebase consistently uses client-side jsPDF. There is no server-side PDF generation anywhere. **Stay client-side** — no new API endpoint needed for attestations. The roadmap mentions `POST /api/documents/attestation` but this is unnecessary given the existing pattern. The plan should note this decision.

---

## 3. Suivi de Carrière (Plan 04-03)

### Current State — UI exists, table is MISSING

**Components already coded:**
- `CareerTimeline` (`components/rh/CareerTimeline.tsx`) — renders a timeline with icons per event type (promotion/mutation/formation/avenant), colored badges, dates via `date-fns/fr`.
- `CareerEventDialog` (`components/rh/CareerEventDialog.tsx`) — form to add an event (type, date, description, details). Posts to `/api/career-events`.
- `/api/career-events` route — inserts into `career_events` table.
- `app/(dashboard)/employes/[id]/page.tsx` — already queries `career_events` and passes data to `CareerTimeline`.

**The problem**: NO SQL migration for `career_events` exists in `supabase/migrations/`. The table is NOT in `types/supabase.ts`. Every insert and select to `career_events` currently fails silently (Supabase returns an error which is swallowed in the API route).

### Migration Needed

```sql
CREATE TABLE career_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('promotion', 'mutation', 'augmentation', 'formation', 'avenant', 'autre')),
  date_event DATE NOT NULL,
  description TEXT,
  old_value JSONB,       -- e.g. {"salaire": 150000, "poste": "Junior Dev"}
  new_value JSONB,       -- e.g. {"salaire": 200000, "poste": "Senior Dev"}
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE career_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_events_company" ON career_events
  USING (company_id = get_user_company_id());
```

The roadmap specifies `salaire_avant` and `salaire_apres` as dedicated columns. The existing `CareerTimeline` uses `new_value` JSONB with key-value rendering. **Decision**: Use `old_value`/`new_value` JSONB (already coded in the component and API route) rather than creating dedicated salary columns. The plan should capture salary changes inside `new_value: { salaire_avant: X, salaire_apres: Y }`.

### `types/supabase.ts` update

After migration, `types/supabase.ts` needs a `career_events` entry. The current `CareerEvent` interface in `CareerTimeline.tsx` uses `event_type` (not `type`) and `date_event`. This is consistent and should be kept.

### Integration Points Already Wired

The employee detail page "Parcours Professionnel" card already has `CareerEventDialog` and `CareerTimeline` rendered. Once the migration exists, the timeline will work with no code changes to the page.

---

## 4. Avenants & Alertes Contractuelles (Plan 04-04)

### Notification System — Already Comprehensive

`POST /api/notifications/sync` (`app/api/notifications/sync/route.ts`) already handles:

1. **CDD expiry at 1, 7, 15, 30 days** (the requirements ask for 30/15/7 — all covered)
2. **Trial period end (10 days before `date_fin_essai`)**
3. Medical exam expiry (30 days)
4. Incomplete dossier alerts (monthly)
5. Evaluation brouillon alerts (7 days)

Deduplication is handled via `titre` uniqueness check before insert.

The `notifications` table schema:
```typescript
{
  id: string
  company_id: string
  type: string            // 'alerte_contrat' | 'evaluation' | 'info'
  titre: string           // used for dedup
  message: string | null
  lu: boolean | null
  user_id: string | null  // NULL = visible to all company users
  created_at: string | null
}
```

**What's missing for DOS-05:**
1. **Avenant/renouvellement form**: `ContractDialog` shows `renouvellement_count` but no dedicated renewal workflow. Adding a "Renouveler / Créer avenant" action that pre-fills a new contract from the existing one would close DOS-05.
2. **Dismissal of alert after renewal**: Currently notifications are never deleted — once a CDD expiry notification is created, it persists even after the contract is renewed. The plan needs to add a dismiss mechanism (e.g., PATCH /api/notifications/[id] with `{lu: true}` is already implied by `NotificationMarkAllRead`, but true dismissal on renewal requires deleting or archiving matching notifications when a contract is renewed/converted).

### `ContractDialog` Current State

- Handles create (POST) and edit (PATCH) for contracts.
- Fields: `employee_id`, `categorie`, `type_contrat` (CDI/CDD/Stage/Apprentissage), `date_debut`, `date_fin`, `date_fin_essai`, `salaire_brut`, `renouvellement_count`.
- CDD warning: max 24 months, max 2 renewals, Art. 15 CT-CI 2025.
- Uses `@base-ui/react` Dialog trigger pattern: `DialogTrigger render={<Button />}` (NOT `asChild`).

**Plan 04-04 approach**: Add a "Renouveler" button variant to `ContractDialog` that pre-populates `renouvellement_count + 1`, clears `date_fin`, and requires a new `date_debut`/`date_fin`. On submit, also call `DELETE` or `PATCH lu=true` on related notifications.

---

## 5. Architecture Patterns

### Pattern: Server Component + Client Filter

Used in `/archives` page — server fetches all data with Supabase, passes as props to a `ArchivesControls` client component that does URL-based filtering via `router.push`. For the fiche employé GED tab, since doc count per employee is small (< 50), prefer in-memory filtering via a client component receiving `initialDocuments` prop.

### Pattern: Client-Side PDF Generation

```typescript
// Existing pattern — use this, no server round-trip
import { generateAttestationPDF, exportPDF } from "@/lib/pdf-templates";
const doc = generateAttestationPDF({ employee, company, type: "travail" });
exportPDF(doc, `attestation_travail_${employee.full_name}`);
```

### Pattern: Notification Insert with Dedup

```typescript
// Check by titre before insert
const { data: existing } = await supabase
  .from("notifications")
  .select("id")
  .eq("company_id", companyId)
  .eq("titre", titre)
  .limit(1)
  .single();
if (existing) continue;
await supabase.from("notifications").insert({ company_id, type, titre, message });
```

### Pattern: RLS via `get_user_company_id()`

Every new table must have:
```sql
ALTER TABLE career_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_events_company" ON career_events
  USING (company_id = get_user_company_id());
```

### Pattern: ContractDialog Trigger (Base UI)

```tsx
// CORRECT — project uses @base-ui/react
<DialogTrigger render={<Button variant="outline" size="sm" />}>
  Renouveler
</DialogTrigger>
// NOT asChild
```

---

## 6. Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom PDF renderer | `lib/pdf-templates.ts` (jsPDF) | Already implemented with company letterhead + FCFA formatting |
| Document filtering | Custom search index | Supabase `.ilike()` + in-memory filter | Already pattern in `/archives` |
| Notification dedup | Complex state machine | Title-based uniqueness check in sync route | Already implemented |
| Date formatting | Custom formatter | `date-fns/fr` (already imported in CareerTimeline) | Already available |
| Career timeline UI | Custom timeline | `CareerTimeline` component | Already complete |

---

## 7. Implementation Risks & Key Decisions

### Risk 1: `career_events` table missing — highest priority

The entire Phase 4 "Parcours" section of the employee page is non-functional until the migration is created. Plan 04-03 must create the migration before anything else. This is a Wave 0 task.

**Decision**: Use JSONB `old_value`/`new_value` columns (matches existing component code) instead of dedicated `salaire_avant`/`salaire_apres` columns (would require component rewrite).

### Risk 2: `types/supabase.ts` desync

`career_events` is queried in the employee page but not in `types/supabase.ts`. TypeScript currently treats this as `any`. After migration, `types/supabase.ts` must be manually updated (project pattern: manual sync, not auto-generated).

### Risk 3: Attestation archiving scope creep

The roadmap says "génération en un clic" — this is done. Adding automatic archiving to Supabase Storage would require: (1) generating the PDF blob client-side, (2) uploading to Supabase Storage, (3) inserting a `documents` row. This is valuable but out of scope for v1 "< 10 seconds" requirement. Plan 04-02 should note this as a potential enhancement.

### Risk 4: Notification dismissal on contract renewal

Currently the sync creates notifications that persist even after the triggering contract is updated. If a CDD is renewed, the "Contrat J-30" notification stays. The plan should add: when a PATCH to `/api/contracts/[id]` updates `date_fin` or `statut`, delete matching `alerte_contrat` notifications for that employee.

### Dependency Wave Ordering

```
Wave 0 (blocking migration):
  - 04-03 Step 1: CREATE TABLE career_events + RLS migration
  - 04-03 Step 2: types/supabase.ts update

Wave 1 (independent, can parallelize):
  - 04-01: GED tab filter on fiche employé
  - 04-03 Steps 3+: timeline already works once table exists

Wave 2 (depends on GED improvements):
  - 04-02: Attestation buttons in GED tab (improves discoverability)
  - 04-04: Avenant form + notification dismissal
```

---

## 8. Environment Availability

Step 2.6: SKIPPED (no external dependencies — all tools already installed: jsPDF 4.2.1, jspdf-autotable 5.0.7, Supabase, date-fns).

---

## 9. Validation Architecture

`nyquist_validation` is explicitly set to `false` in `.planning/config.json`. This section is skipped.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `app/(dashboard)/archives/page.tsx` — GED current state
- `app/(dashboard)/employes/[id]/page.tsx` — employee detail page
- `components/rh/CareerTimeline.tsx` — timeline component
- `components/rh/CareerEventDialog.tsx` — career event form
- `components/rh/ContractDialog.tsx` — contract form
- `components/rh/AttestationButton.tsx` — attestation PDF trigger
- `components/rh/DocumentDropdown.tsx` — document generation dropdown
- `lib/pdf-templates.ts` — PDF generation templates
- `app/api/notifications/sync/route.ts` — notification system
- `app/api/career-events/route.ts` — career events API
- `types/supabase.ts` — database types (career_events NOT present)
- `supabase/migrations/` listing — career_events migration NOT present
- `package.json` — jsPDF 4.2.1, jspdf-autotable 5.0.7 confirmed installed
- `.planning/config.json` — nyquist_validation: false

---

## Metadata

**Confidence breakdown:**
- GED state: HIGH — read entire archives page and employee detail page
- PDF generation: HIGH — read pdf-templates.ts, AttestationButton, DocumentDropdown
- Career events: HIGH — confirmed no migration, no types, but UI components complete
- Notification system: HIGH — read entire sync route (276 lines)
- ContractDialog: HIGH — read entire component

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (stable domain — Supabase and jsPDF APIs don't change fast)
