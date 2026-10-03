INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reflections',
  'reflections',
  false,
  52428800,
  ARRAY['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users_own_audio_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reflections' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "users_own_audio_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reflections' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "users_own_audio_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'reflections' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Perfil/muro público: AudioPlayer resuelve la reproducción vía
-- createSignedUrl() en el cliente, que sigue exigiendo RLS de
-- storage.objects para quien la pide. Esta policy es aditiva — no toca el
-- acceso privado existente del dueño. No depende de is_featured: cualquier
-- reflexión marcada is_public es reproducible, destacado o no.
CREATE POLICY "public_audio_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'reflections' AND EXISTS (
      SELECT 1 FROM reflections r
      WHERE r.audio_path = storage.objects.name
        AND r.is_public = true
    )
  );
