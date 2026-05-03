-- =============================================================================
-- Migration : Signatures électroniques + Invitations portail salarié
-- - document_signatures : horodatage et audit des signatures
-- - signature_requests : documents en attente de signature
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE signature_status AS ENUM ('en_attente', 'signe', 'refuse', 'expire');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Demandes de signature (initialisées par l'admin RH) ────────────────────
CREATE TABLE IF NOT EXISTS signature_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  doc_type        VARCHAR(40) NOT NULL,    -- contrat / avenant / sanction / stc / reglement_interieur / autre
  titre           VARCHAR(200) NOT NULL,
  description     TEXT,
  document_url    TEXT,                     -- lien vers le PDF stocké
  reference       VARCHAR(80),
  status          signature_status NOT NULL DEFAULT 'en_attente',
  expire_le       DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id),
  signed_at       TIMESTAMPTZ,
  refused_at      TIMESTAMPTZ,
  refus_motif     TEXT,
  signature_hash  VARCHAR(128),            -- empreinte cryptographique
  signature_ip    VARCHAR(45),
  signature_user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_sigreq_company ON signature_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_sigreq_employee ON signature_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_sigreq_status ON signature_requests(status);

ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

-- Admin RH : voit toutes les signatures de son entreprise
CREATE POLICY "tenant_isolation_sigreq_admin" ON signature_requests
  USING (company_id = public.get_user_company_id());

-- Salarié : voit uniquement les siennes
CREATE POLICY "self_sigreq_select" ON signature_requests
  FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- Salarié : peut signer/refuser ses propres demandes
CREATE POLICY "self_sigreq_update" ON signature_requests
  FOR UPDATE
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND status = 'en_attente'
  )
  WITH CHECK (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- ── Audit des événements de signature ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS signature_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
  event         VARCHAR(40) NOT NULL,     -- CREATED / VIEWED / SIGNED / REFUSED / EXPIRED
  user_id       UUID REFERENCES auth.users(id),
  metadata      JSONB DEFAULT '{}'::jsonb,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sigevents_request ON signature_events(request_id);

ALTER TABLE signature_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_sigevents_select" ON signature_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM signature_requests sr
      WHERE sr.id = signature_events.request_id
        AND (sr.company_id = public.get_user_company_id()
             OR sr.employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid()))
    )
  );
