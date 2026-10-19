-- Historial de lectura: cada registro diario guarda desde qué página y
-- hasta cuál se leyó (ej. "de la 187 a la 230"), no solo el total.
-- Los registros anteriores quedan con start_page/end_page en NULL.
ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS start_page INTEGER,
  ADD COLUMN IF NOT EXISTS end_page   INTEGER;

-- Nueva función log_reading: toma el usuario de auth.uid() y verifica que
-- el libro sea suyo. (upsert_reading_log era SECURITY DEFINER y recibía
-- p_user_id del cliente: cualquiera podía escribir registros de otro.)
CREATE OR REPLACE FUNCTION log_reading(
  p_book_id    UUID,
  p_start_page INTEGER,
  p_end_page   INTEGER,
  p_logged_at  DATE
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL OR p_end_page = p_start_page THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM books WHERE id = p_book_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'book not found';
  END IF;

  -- Corrección a la baja (ej. escribiste 314 en vez de 74): ajusta el
  -- registro de ese día en vez de dejar páginas que nunca se leyeron.
  IF p_end_page < p_start_page THEN
    UPDATE reading_logs
    SET end_page   = CASE WHEN start_page IS NULL THEN end_page ELSE GREATEST(p_end_page, start_page) END,
        pages_read = CASE
          WHEN start_page IS NULL THEN GREATEST(0, pages_read - (p_start_page - p_end_page))
          ELSE GREATEST(p_end_page, start_page) - start_page
        END
    WHERE user_id = v_user AND book_id = p_book_id AND logged_at = p_logged_at;

    DELETE FROM reading_logs
    WHERE user_id = v_user AND book_id = p_book_id AND logged_at = p_logged_at AND pages_read <= 0;
    RETURN;
  END IF;

  -- Mismo día y libro: se conserva la página inicial del primer registro
  -- y se mueve la final.
  INSERT INTO reading_logs (user_id, book_id, pages_read, logged_at, start_page, end_page)
  VALUES (v_user, p_book_id, p_end_page - p_start_page, p_logged_at, p_start_page, p_end_page)
  ON CONFLICT (user_id, book_id, logged_at)
  DO UPDATE SET
    pages_read = reading_logs.pages_read + EXCLUDED.pages_read,
    start_page = COALESCE(reading_logs.start_page, EXCLUDED.start_page),
    end_page   = EXCLUDED.end_page;
END;
$$;

-- upsert_reading_log se mantiene solo por compatibilidad con la versión
-- desplegada, pero ahora ignora p_user_id y usa auth.uid(). Eliminarla
-- cuando ya no haya clientes viejos llamándola.
CREATE OR REPLACE FUNCTION upsert_reading_log(
  p_user_id    UUID,
  p_book_id    UUID,
  p_pages_read INTEGER,
  p_logged_at  DATE
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL OR NOT EXISTS (SELECT 1 FROM books WHERE id = p_book_id AND user_id = v_user) THEN
    RETURN;
  END IF;
  INSERT INTO reading_logs (user_id, book_id, pages_read, logged_at)
  VALUES (v_user, p_book_id, p_pages_read, p_logged_at)
  ON CONFLICT (user_id, book_id, logged_at)
  DO UPDATE SET pages_read = reading_logs.pages_read + EXCLUDED.pages_read;
END;
$$;

-- Ejecutar aparte (ver README: en el mismo script no siempre queda aplicado)
-- REVOKE EXECUTE ON FUNCTION log_reading(UUID, INTEGER, INTEGER, DATE) FROM anon, public;
