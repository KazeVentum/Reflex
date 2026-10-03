-- Companion to migration_decouple_public_from_featured.sql: drop the
-- is_featured requirement from audio playback access too, so a public
-- reflection's audio is playable on its author's profile regardless of
-- featured status.

DROP POLICY IF EXISTS "public_featured_audio_select" ON storage.objects;

CREATE POLICY "public_audio_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'reflections' AND EXISTS (
      SELECT 1 FROM reflections r
      WHERE r.audio_path = storage.objects.name
        AND r.is_public = true
    )
  );
