-- Versioning des documents GED
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  company_id UUID NOT NULL,
  employee_id UUID REFERENCES employees(id),
  version INTEGER NOT NULL DEFAULT 1,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id),
  commentaire TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_employee ON document_versions(employee_id);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company access document_versions" ON document_versions
  FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
