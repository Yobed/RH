-- Migration : ajout des champs légaux sur companies pour le bulletin de paie CI
-- Date : 2026-03-30
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS raison_sociale  VARCHAR(200),
  ADD COLUMN IF NOT EXISTS adresse         TEXT,
  ADD COLUMN IF NOT EXISTS cnps_matricule  VARCHAR(30),
  ADD COLUMN IF NOT EXISTS nccm            VARCHAR(30),
  ADD COLUMN IF NOT EXISTS ncc             VARCHAR(30);

COMMENT ON COLUMN companies.raison_sociale  IS 'Dénomination sociale légale — affiché sur le bulletin de paie';
COMMENT ON COLUMN companies.cnps_matricule  IS 'Numéro matricule CNPS employeur CI';
COMMENT ON COLUMN companies.nccm            IS 'Numéro de Compte Cotisant Maladie CNAM';
COMMENT ON COLUMN companies.ncc             IS 'Numéro de Compte Contribuable DGI CI';
