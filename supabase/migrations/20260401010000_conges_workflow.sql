-- Migration : workflow de validation multi-niveaux congés
-- Phase 03-02 — Statut étendu + colonnes audit workflow

-- 1. Renommer "demande" → "en_attente" pour les existants
UPDATE conges SET statut = 'en_attente' WHERE statut = 'demande';

-- 2. Ajouter colonnes audit (IF NOT EXISTS pour idempotence)
ALTER TABLE conges
  ADD COLUMN IF NOT EXISTS validated_by_manager_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS validated_by_manager_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_by_rh_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS validated_by_rh_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refus_motif TEXT;

-- 3. Contrainte CHECK sur les valeurs de statut
-- (DROP IF EXISTS pour idempotence si migration rejouée)
ALTER TABLE conges
  DROP CONSTRAINT IF EXISTS conges_statut_check;

ALTER TABLE conges
  ADD CONSTRAINT conges_statut_check
  CHECK (statut IN ('en_attente','valide_manager','approuve','refuse'));
