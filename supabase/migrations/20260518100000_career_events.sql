-- ================================================================
-- Migration : career_events — Historique parcours employé (timeline)
-- Date : 2026-05-18
-- ================================================================
-- La table existait peut-être créée à la main ; cette migration la formalise
-- avec IF NOT EXISTS pour rester idempotente.

CREATE TABLE IF NOT EXISTS career_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,                  -- embauche, promotion, mutation, avenant, formation, augmentation, changement_poste, depart
  date_event    DATE NOT NULL,
  description   TEXT,
  old_value     JSONB,                          -- État avant (poste, salaire, département…)
  new_value     JSONB,                          -- État après
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_career_events_employee ON career_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_career_events_company ON career_events(company_id);
CREATE INDEX IF NOT EXISTS idx_career_events_date ON career_events(date_event DESC);

COMMENT ON TABLE career_events IS 'Historique des événements de carrière par employé : embauche, promotion, mutation, avenant, formation, augmentation salaire, changement de poste, départ. Visible côté RH ET côté portail salarié.';
COMMENT ON COLUMN career_events.event_type IS 'embauche | promotion | mutation | avenant | formation | augmentation | changement_poste | depart';

-- RLS : RH voit tous les events de son entreprise, le salarié voit uniquement les siens
ALTER TABLE career_events ENABLE ROW LEVEL SECURITY;

-- Policy RH (multi-tenant) — lecture/écriture si même company
DROP POLICY IF EXISTS "tenant_isolation_career_events" ON career_events;
CREATE POLICY "tenant_isolation_career_events" ON career_events
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- Policy portail salarié — un employé voit son propre historique
-- via profiles.employee_id (lien user ↔ employee)
DROP POLICY IF EXISTS "portail_employee_own_career" ON career_events;
CREATE POLICY "portail_employee_own_career" ON career_events
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM profiles WHERE id = auth.uid() AND role = 'salarie'
    )
  );
