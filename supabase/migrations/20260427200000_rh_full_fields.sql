-- Migration : champs manquants pour documenter employés, contrats, bulletins et congés
-- comme des formulaires papier complets (droit ivoirien)

-- ── EMPLOYÉS ────────────────────────────────────────────────────────────────
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS lieu_naissance          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS num_cni                 VARCHAR(30),
  ADD COLUMN IF NOT EXISTS date_expiration_cni     DATE,
  ADD COLUMN IF NOT EXISTS adresse                 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS situation_logement      VARCHAR(30),   -- Locataire / Propriétaire / Hébergé
  ADD COLUMN IF NOT EXISTS rib                     VARCHAR(50),   -- Coordonnées bancaires
  ADD COLUMN IF NOT EXISTS mobile_money            VARCHAR(30),   -- Orange Money / Wave / MTN
  ADD COLUMN IF NOT EXISTS contact_urgence_nom     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contact_urgence_tel     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS anciennete_anterieure   INTEGER DEFAULT 0,  -- mois avant embauche
  ADD COLUMN IF NOT EXISTS groupe_sanguin          VARCHAR(5),
  ADD COLUMN IF NOT EXISTS convention_collective   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS site_travail            VARCHAR(100),
  ADD COLUMN IF NOT EXISTS nb_personnes_charge     INTEGER DEFAULT 0;

-- ── CONTRATS ────────────────────────────────────────────────────────────────
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS lieu_travail            VARCHAR(150),
  ADD COLUMN IF NOT EXISTS duree_hebdo             NUMERIC(5,2) DEFAULT 40,
  ADD COLUMN IF NOT EXISTS description_poste       TEXT,
  ADD COLUMN IF NOT EXISTS convention_collective   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS clause_non_concurrence  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS clause_confidentialite  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS avantages_nature        TEXT,
  ADD COLUMN IF NOT EXISTS motif_cdd               TEXT,          -- obligatoire pour CDD (Art. 14 CT-CI)
  ADD COLUMN IF NOT EXISTS signataire_nom          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_signature          DATE;

-- ── BULLETINS DE PAIE ───────────────────────────────────────────────────────
ALTER TABLE bulletins_paie
  ADD COLUMN IF NOT EXISTS heures_normales         NUMERIC(6,2)  DEFAULT 173.33,
  ADD COLUMN IF NOT EXISTS prime_logement          NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_responsabilite    NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remboursement_frais     NUMERIC(12,2) DEFAULT 0;

-- ── CONGÉS ──────────────────────────────────────────────────────────────────
ALTER TABLE conges
  ADD COLUMN IF NOT EXISTS conge_fractionne        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS date_reprise            DATE,
  ADD COLUMN IF NOT EXISTS remplacant_id           UUID REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS justificatif_url        TEXT;
