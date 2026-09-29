-- Companion to migration_add_public_content.sql: AudioPlayer.tsx resolves
-- playback via createSignedUrl() client-side, which still enforces
-- storage.objects RLS for the requesting viewer. Today's policies are
-- owner-only ((storage.foldername(name))[1] = auth.uid()::text), so a
-- non-owner would get a 403 even once the reflections row itself is
-- publicly visible. This is additive — it doesn't touch the owner's
-- existing private access.

CREATE POLICY "public_featured_audio_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'reflections' AND EXISTS (
      SELECT 1 FROM reflections r
      JOIN profiles p ON p.id = r.user_id
      WHERE r.audio_path = storage.objects.name
        AND r.is_public = true
        AND p.is_featured = true
    )
  );
