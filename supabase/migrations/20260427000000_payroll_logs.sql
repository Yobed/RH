-- Migration : table payroll_logs pour l'import Sage
-- Phase 8 — Import Paie Sage
-- ISP-04 : traçabilité complète, aucune autre table modifiée
-- Colonnes calquées sur SagePayrollImportService.column_mapping (Python)

CREATE TABLE IF NOT EXISTS payroll_logs (
  -- Clé primaire et isolation multi-tenant
  id                      UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id              UUID          NOT NULL REFERENCES companies(id),

  -- Identité employé (valeur brute Sage — TEXT, pas UUID FK)
  employee_id             TEXT          NOT NULL,  -- premier mot de "Matricule/Nom" (ex: "EMP001")
  employee_name           TEXT,                     -- reste de "Matricule/Nom" (ex: "KOFFI Jean")

  -- Champs salariaux (22 colonnes du mapping SagePayrollImportService)
  days_worked             NUMERIC(10, 2),           -- Jours de présence
  base_salary             NUMERIC(14, 2),           -- Salaire de base
  bonus_salary            NUMERIC(14, 2),           -- Sursalaire
  seniority_premium       NUMERIC(14, 2),           -- Prime d'ancienneté
  transport_allowance     NUMERIC(14, 2),           -- Indemnité de transport
  vacation_allowance      NUMERIC(14, 2),           -- Indemnité congés payés
  overtime_pay            NUMERIC(14, 2),           -- Heures supplémentaires
  gross_salary            NUMERIC(14, 2),           -- *** SALAIRE BRUT ***
  exempt_indemnity        NUMERIC(14, 2),           -- *** INDEMNITE EXONEREE ***
  fiscal_gross            NUMERIC(14, 2),           -- *** BRUT FISCAL ***
  social_gross            NUMERIC(14, 2),           -- *** BRUT SOCIAL ***
  tax_is                  NUMERIC(14, 2),           -- Impôts sur salaire (IS)
  tax_cn                  NUMERIC(14, 2),           -- Contribution nationale (CN)
  tax_igr                 NUMERIC(14, 2),           -- Impôt général sur revenu (IGR)
  withholding_cnps        NUMERIC(14, 2),           -- Retenue CNPS
  total_contributions     NUMERIC(14, 2),           -- *** TOTAL DES COTISATIONS ***
  net_before_withholding  NUMERIC(14, 2),           -- *** NET AVANT RETENUE ***
  adjustment_m_minus_1    NUMERIC(14, 2),           -- Reprise arrondi de paie (M-1)
  negative_pay_adjustment NUMERIC(14, 2),           -- Reprise paie négative (M-1)
  negative_advance        NUMERIC(14, 2),           -- Avance paie négative
  rounding_adjustment     NUMERIC(14, 2),           -- Arrondi de paie
  net_to_pay              NUMERIC(14, 2),           -- NET A PAYER

  -- Métadonnées d'import
  periode                 TEXT,                     -- Format YYYY-MM (mois importé)
  import_source           TEXT          NOT NULL DEFAULT 'sage',
  imported_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
  imported_by             UUID          REFERENCES auth.users(id)
);

ALTER TABLE payroll_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "isolation_company" ON payroll_logs
  USING (company_id = get_user_company_id());

CREATE INDEX IF NOT EXISTS idx_payroll_logs_company_period
  ON payroll_logs(company_id, periode);

CREATE INDEX IF NOT EXISTS idx_payroll_logs_company_employee
  ON payroll_logs(company_id, employee_id);
