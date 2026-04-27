-- Migration : aligner bulletins_paie sur les 22 colonnes Sage
-- Phase 8 — Import Paie Sage (B)
-- Ajout additif : aucune colonne existante supprimée

ALTER TABLE bulletins_paie
  ADD COLUMN IF NOT EXISTS days_worked             NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS vacation_allowance      NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS overtime_pay            NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS gross_salary            NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS exempt_indemnity        NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS fiscal_gross            NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS social_gross            NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS tax_is                  NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS tax_cn                  NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS tax_igr                 NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS withholding_cnps        NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS total_contributions     NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS net_before_withholding  NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS adjustment_m_minus_1    NUMERIC(14, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS negative_pay_adjustment NUMERIC(14, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS negative_advance        NUMERIC(14, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rounding_adjustment     NUMERIC(14, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_to_pay              NUMERIC(14, 2);
