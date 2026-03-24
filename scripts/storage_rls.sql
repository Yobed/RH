-- ============================================================
-- RLS Supabase Storage
-- Bucket rh-documents  : acces par company_id extrait du chemin
-- Bucket legal-documents : lecture pour tous les authentifies,
--                          upload/delete reserve aux admins RH
-- ============================================================

-- ── rh-documents : upload par les utilisateurs connectes ────
CREATE POLICY "rh_docs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'rh-documents'
    AND (storage.foldername(name))[1] = 'documents'
  );

CREATE POLICY "rh_docs_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'rh-documents'
  );

CREATE POLICY "rh_docs_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'rh-documents'
  );

-- ── legal-documents : lecture + upload par authentifies ─────
CREATE POLICY "legal_docs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'legal-documents');

CREATE POLICY "legal_docs_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'legal-documents');

CREATE POLICY "legal_docs_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'legal-documents');
