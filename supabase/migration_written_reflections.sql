-- Reflexiones escritas: una reflexión puede no tener audio. En ese caso el
-- texto vive en `notes`. Al menos uno de los dos tiene que existir.
ALTER TABLE reflections ALTER COLUMN audio_path DROP NOT NULL;

ALTER TABLE reflections
  ADD CONSTRAINT reflections_audio_or_text
  CHECK (audio_path IS NOT NULL OR (notes IS NOT NULL AND length(trim(notes)) > 0));
