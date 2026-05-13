-- ================================================================
-- Migration : Primes paramétrables sur le contrat (imposables / non imposables)
-- Date : 2026-05-13
-- ----------------------------------------------------------------
-- Permet de définir librement, sur le contrat de chaque employé,
-- des primes avec un libellé, un montant mensuel et une nature :
--   - imposable = TRUE  → entre dans le brut (soumise CNPS + ITS)
--   - imposable = FALSE → exonérée, impacte directement le net
-- ================================================================

CREATE TABLE IF NOT EXISTS contract_primes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  libelle     TEXT NOT NULL,
  montant     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (montant >= 0),
  imposable   BOOLEAN NOT NULL DEFAULT TRUE,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  date_debut  DATE,
  date_fin    DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_primes_employee ON contract_primes(employee_id);
CREATE INDEX IF NOT EXISTS idx_contract_primes_company  ON contract_primes(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_primes_actif    ON contract_primes(actif);

COMMENT ON TABLE  contract_primes              IS 'Primes paramétrables rattachées au contrat de l''employé (imposables ou non imposables)';
COMMENT ON COLUMN contract_primes.libelle      IS 'Libellé de la prime (ex : Prime de rendement, Prime de panier, Indemnité de logement…)';
COMMENT ON COLUMN contract_primes.montant      IS 'Montant mensuel en FCFA';
COMMENT ON COLUMN contract_primes.imposable    IS 'TRUE = entre dans le brut (CNPS + ITS) ; FALSE = exonérée, ajoutée au net';
COMMENT ON COLUMN contract_primes.actif        IS 'Désactiver pour ne plus intégrer la prime dans la paie sans la supprimer';
COMMENT ON COLUMN contract_primes.date_debut   IS 'Date d''entrée en vigueur (NULL = immédiat)';
COMMENT ON COLUMN contract_primes.date_fin     IS 'Date de fin (NULL = sans terme)';

-- ── RLS multi-tenant ─────────────────────────────────────────────
ALTER TABLE contract_primes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contract_primes_isolation" ON contract_primes;
CREATE POLICY "contract_primes_isolation" ON contract_primes
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

-- ── Trigger updated_at ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_contract_primes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contract_primes_updated_at ON contract_primes;
CREATE TRIGGER trg_contract_primes_updated_at
  BEFORE UPDATE ON contract_primes
  FOR EACH ROW
  EXECUTE FUNCTION set_contract_primes_updated_at();
