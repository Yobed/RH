# Phase 8: Import Paie Sage - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Source:** PRD Express Path (user spec — /gsd:plan-phase)

<domain>
## Phase Boundary

Cette phase livre une fonctionnalité complète d'importation du Livre de Paie Sage dans Antigravity. Les utilisateurs (RH) exportent leur livre de paie depuis Sage Paie, copient les données dans un template SIRH, et importent ce fichier. Le système traite les données (nettoyage + mapping), les écrit dans `payroll_logs` uniquement, et affiche des erreurs explicites en cas d'incohérence.

**Périmètre inclus :**
- Page Next.js dédiée `/paie/import-sage`
- Template Excel de mapping téléchargeable
- API route `POST /api/paie/import-sage` appelant le script Python
- Script Python via API (Flask/FastAPI serverless ou route Next.js avec `child_process`)
- Table Supabase `payroll_logs` (ou extension si elle existe déjà)
- Validation des données avant toute écriture
- UI drag-and-drop cohérente avec l'existant

**Périmètre exclu :**
- Modification de toute table existante autre que `payroll_logs`
- Connexion directe à Sage Paie (pas d'API Sage)
- Modification du processus de paie existant dans Antigravity
- Support de formats autres qu'Excel (.xlsx)

</domain>

<decisions>
## Implementation Decisions

### Page & UX (ISP-01)
- Route : `app/(dashboard)/paie/import-sage/page.tsx`
- Drag-and-drop zone pour upload du fichier Excel rempli
- Bouton "Télécharger le template" qui sert le fichier template Excel
- Cohérence visuelle avec les autres pages paie (`/paie`, `/paie/masse-salariale`)
- Langue : Français uniquement

### Template de Mapping (ISP-02)
- Le template est un fichier `.xlsx` statique servi depuis `/public/templates/template-import-sage.xlsx`
- Colonnes du template : `Matricule/Nom`, `Salaire de base`, `Brut Social`, `Net A Payer`
- Instruction dans le template : "Copiez-collez vos données Sage dans ces colonnes"
- Résout la variabilité des versions Sage : l'utilisateur copie, pas le système qui parse directement le format Sage

### Script de Traitement Python (ISP-03)
- Le script Python est intégré comme route API Next.js appelant un microservice Python, OU comme script exécuté via `child_process` dans une Route Handler
- Logique exacte fournie par le client :
  ```python
  import pandas as pd
  import numpy as np

  def process_sage_import(file_path):
      df = pd.read_excel(file_path, header=7)
      cols_to_clean = ['Salaire de base', 'Brut Social', 'Net A Payer']
      for col in cols_to_clean:
          if col in df.columns:
              df[col] = df[col].replace(r'[ \xa0\s]', '', regex=True).replace(',', '.', regex=True).astype(float)
      mapping = {
          'Matricule/Nom': 'employee_id',
          'Salaire de base': 'base_salary',
          'Net A Payer': 'net_pay'
      }
      df = df.rename(columns=mapping)
      return df[list(mapping.values())]
  ```
- **Note architecture :** Dans un contexte Next.js sur Vercel, Python ne s'exécute pas nativement. Options : (a) Route API Python séparée (Vercel Python function), (b) Déporter le traitement dans une Edge Function n8n, (c) Ré-implémenter la logique en TypeScript/JavaScript dans la Route Handler.
- **Décision architecturale à trancher en research :** Préférence pour option (c) — ré-implémenter en TypeScript pour éviter une dépendance Python, sauf si le client a déjà un microservice Python disponible.

### Intégrité des données (ISP-04)
- Seule la table `payroll_logs` est écrite
- Chaque ligne du fichier importé → une entrée dans `payroll_logs` avec : `company_id`, `employee_id`, `base_salary`, `net_pay`, `import_source: 'sage'`, `imported_at: now()`, `imported_by: user.id`
- Si la table `payroll_logs` n'existe pas → migration SQL à créer
- Les tables `employees`, `pay_slips`, et toutes autres tables existantes restent intactes

### Validation avant import (ISP-05)
- Colonnes requises : `Matricule/Nom`, `Salaire de base`, `Net A Payer`
- Si colonne manquante → erreur : "Colonne '{X}' manquante dans le fichier importé. Vérifiez que vous avez utilisé le template fourni."
- Si valeur non numérique dans `Salaire de base` ou `Net A Payer` → erreur ligne par ligne
- Si plus de 0 erreurs → aucune écriture en base, affichage de la liste des erreurs à l'utilisateur
- Validation côté serveur uniquement (route handler) — jamais côté client

### Claude's Discretion
- Gestion des doublons : si un import a déjà été fait pour la même période et le même employé, afficher un avertissement mais pas bloquer (à confirmer en research)
- Format du retour API : `{ success: true, imported: N, errors: [] }` ou `{ success: false, errors: [{row, message}] }`
- Pagination ou limite sur le nombre de lignes importables simultanément

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Stack
- `skills/architecture/SKILL.md` — Stack Next.js 14 App Router, patterns Server Component, Route Handler API, Supabase client
- `CLAUDE.md` — Conventions obligatoires : multi-tenant (company_id RLS), nommage, devises FCFA, langue française

### Paie existante (module de référence)
- `app/(dashboard)/paie/page.tsx` — Structure de la page paie principale (UX de référence)
- `app/(dashboard)/paie/masse-salariale/` — Page masse salariale (UX drag-and-drop/upload à reprendre si existant)
- `app/api/paie/` — Patterns des routes API paie existantes
- `lib/paie-ci.ts` — Bibliothèque calcul paie CI (ne pas modifier)

### Database
- `skills/database/SKILL.md` — Patterns migrations Supabase, RLS, naming conventions
- `types/supabase.ts` — Types générés Supabase (à mettre à jour après migration)

### Formulaires & Upload
- `skills/forms/SKILL.md` — Patterns formulaires, upload fichiers

### Sécurité
- `skills/security/SKILL.md` — Règles sécurité endpoints API

</canonical_refs>

<specifics>
## Specific Ideas

### SagePayrollImportService — mapping complet (22 colonnes)

Classe fournie par le client. Implementation TypeScript dans lib/paie-sage-import.ts doit reproduire:
- cleanCurrency: retourne 0 pour valeurs invalides (null/vide/NaN)
- COLUMN_MAPPING: 22 entrees, cles = noms colonnes Sage natif
- extractEmployeeInfo: employee_id = premier mot, employee_name = reste
- Detection auto header: scanner 15 premieres lignes pour trouver "Jours de presence"

Mapping complet Sage -> SIRH:
- Jours de presence -> days_worked
- Salaire de base -> base_salary
- Sursalaire -> bonus_salary
- Prime anciennete -> seniority_premium
- Indemnite transport -> transport_allowance
- Indemnite conges payes -> vacation_allowance
- Heures supplementaires -> overtime_pay
- SALAIRE BRUT -> gross_salary
- INDEMNITE EXONEREE -> exempt_indemnity
- BRUT FISCAL -> fiscal_gross
- BRUT SOCIAL -> social_gross
- Impots salaire IS -> tax_is
- Contribution nationale CN -> tax_cn
- IGR -> tax_igr
- Retenue CNPS -> withholding_cnps
- TOTAL COTISATIONS -> total_contributions
- NET AVANT RETENUE -> net_before_withholding
- Reprise arrondi M-1 -> adjustment_m_minus_1
- Reprise paie negative M-1 -> negative_pay_adjustment
- Avance paie negative -> negative_advance
- Arrondi de paie -> rounding_adjustment
- NET A PAYER -> net_to_pay

### Comportement UX attendu
1. RH va sur /paie/import-sage
2. Clique "Telecharger le template" -> recoit template-import-sage.xlsx
3. Ouvre le fichier, colle ses donnees Sage dans les colonnes
4. Revient sur la page, drag-and-drop le fichier rempli
5. Clique "Importer" -> feedback en temps reel

</specifics>

<deferred>
## Deferred Ideas

- Connexion directe API Sage Paie (nécessite partenariat Sage)
- Support format CSV ou autres versions Sage
- Réconciliation automatique avec les bulletins existants dans `pay_slips`
- Interface de matching `employee_id` Sage ↔ `id` employé SIRH (si les matricules divergent)
- Historique des imports avec possibilité de rollback

</deferred>

---

*Phase: 08-import-sage-paie*
*Context gathered: 2026-04-27 via PRD Express Path (user spec)*
