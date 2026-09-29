CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- TABLA: profiles
-- Un registro por usuario (id = auth.users.id), con roles/flags de app.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  display_name TEXT,
  is_admin     BOOLEAN     NOT NULL DEFAULT false,
  is_featured  BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crea el profile automáticamente al registrarse.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill para usuarios que ya existían antes de este trigger.
INSERT INTO public.profiles (id, email, display_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile_select" ON profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "featured_profiles_select_authenticated" ON profiles FOR SELECT TO authenticated
  USING (is_featured = true);

-- Recursion-safe: la subquery solo busca la propia fila del que llama
-- (admin_row.id = auth.uid()), que ya es visible sin condiciones por la
-- policy de arriba — no hay recursión abierta.
CREATE POLICY "admins_select_all_profiles" ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_row
      WHERE admin_row.id = (SELECT auth.uid()) AND admin_row.is_admin = true
    )
  );

CREATE POLICY "admins_update_all_profiles" ON profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_row
      WHERE admin_row.id = (SELECT auth.uid()) AND admin_row.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_row
      WHERE admin_row.id = (SELECT auth.uid()) AND admin_row.is_admin = true
    )
  );

-- Sin policy de auto-actualización a propósito: RLS es por fila, no por
-- columna, así que una policy "propia fila" para UPDATE dejaría a
-- cualquier usuario poner su propio is_admin/is_featured en true.

-- ─────────────────────────────────────────
-- TABLA: books
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title         TEXT        NOT NULL,
  author        TEXT,
  total_pages   INTEGER,
  current_page  INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_user ON books(user_id, created_at DESC);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_books_select" ON books FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_books_insert" ON books FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_books_update" ON books FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_books_delete" ON books FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ─────────────────────────────────────────
-- TABLA: reflections
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reflections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id          UUID        REFERENCES books(id) ON DELETE SET NULL,
  page_number      INTEGER,
  title            TEXT,
  audio_path       TEXT        NOT NULL,
  duration_seconds INTEGER,
  tags             TEXT[]      NOT NULL DEFAULT '{}',
  notes            TEXT,
  is_public        BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reflections_user_created ON reflections(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_book         ON reflections(book_id);
CREATE INDEX IF NOT EXISTS idx_reflections_tags         ON reflections USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_reflections_public       ON reflections(is_public) WHERE is_public = true;

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_reflections_select" ON reflections FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_reflections_insert" ON reflections FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_reflections_update" ON reflections FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_reflections_delete" ON reflections FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Contenido de un usuario is_featured que él mismo marcó is_public: visible
-- para cualquier usuario autenticado (feed de autores destacados).
CREATE POLICY "featured_public_reflections_select_authenticated" ON reflections FOR SELECT TO authenticated
  USING (
    is_public = true
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = reflections.user_id AND p.is_featured = true)
  );

-- ─────────────────────────────────────────
-- TABLA: quotes
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id     UUID        REFERENCES books(id) ON DELETE SET NULL,
  page_number INTEGER,
  quote_text  TEXT        NOT NULL,
  notes       TEXT,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  is_public   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_user_created ON quotes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_book         ON quotes(book_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tags         ON quotes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_quotes_public       ON quotes(is_public) WHERE is_public = true;

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_quotes_select" ON quotes FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_quotes_insert" ON quotes FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_quotes_update" ON quotes FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_quotes_delete" ON quotes FOR DELETE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "featured_public_quotes_select_authenticated" ON quotes FOR SELECT TO authenticated
  USING (
    is_public = true
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = quotes.user_id AND p.is_featured = true)
  );

-- Segunda FK directa a profiles(id) (además de la que ya va a auth.users):
-- el embedding de PostgREST (.select("*, profiles(...)")) necesita una FK
-- directa para descubrir la relación; compartir referencia a auth.users
-- no alcanza.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reflections_user_id_profiles_fkey') THEN
    ALTER TABLE reflections
      ADD CONSTRAINT reflections_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_user_id_profiles_fkey') THEN
    ALTER TABLE quotes
      ADD CONSTRAINT quotes_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Requerida o el join embebido books(id,title,author) del feed vuelve null:
-- PostgREST chequea RLS de la tabla embebida de forma independiente a la
-- policy de la fila padre.
--
-- Tradeoff deliberado: RLS es por fila, no por columna, así que esto deja
-- leer la fila COMPLETA de books (no solo id/title/author) a cualquier
-- usuario autenticado, para cualquier libro con al menos una reflexión/cita
-- pública de un usuario destacado. La UI del feed solo pide id/title/author,
-- pero un select("*") directo vería también current_page/total_pages/
-- created_at. Aceptado a la escala de esta app personal.
CREATE POLICY "public_featured_books_select" ON books FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM reflections r WHERE r.book_id = books.id AND r.is_public = true)
    OR EXISTS (SELECT 1 FROM quotes q WHERE q.book_id = books.id AND q.is_public = true)
  );

-- ─────────────────────────────────────────
-- TABLA: reading_logs
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reading_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id     UUID        REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  pages_read  INTEGER     NOT NULL DEFAULT 0,
  logged_at   DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un solo registro por usuario+libro+día (upsert acumulativo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_logs_unique_day  ON reading_logs(user_id, book_id, logged_at);
CREATE INDEX        IF NOT EXISTS idx_reading_logs_user_date   ON reading_logs(user_id, logged_at DESC);

ALTER TABLE reading_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_reading_logs_select" ON reading_logs FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_reading_logs_insert" ON reading_logs FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_reading_logs_update" ON reading_logs FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "users_own_reading_logs_delete" ON reading_logs FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ─────────────────────────────────────────
-- FUNCIÓN: upsert_reading_log
-- Acumula pages_read si ya existe un registro para ese día
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION upsert_reading_log(
  p_user_id    UUID,
  p_book_id    UUID,
  p_pages_read INTEGER,
  p_logged_at  DATE
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO reading_logs (user_id, book_id, pages_read, logged_at)
  VALUES (p_user_id, p_book_id, p_pages_read, p_logged_at)
  ON CONFLICT (user_id, book_id, logged_at)
  DO UPDATE SET pages_read = reading_logs.pages_read + EXCLUDED.pages_read;
END;
$$;
