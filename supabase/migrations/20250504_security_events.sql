-- Journalisation des événements de sécurité
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  company_id UUID,
  type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  risk_level TEXT DEFAULT 'low',
  acquitte BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read security_events" ON security_events
  FOR SELECT USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'responsable_rh')
  );

CREATE POLICY "Insert security_events" ON security_events
  FOR INSERT WITH CHECK (true);
