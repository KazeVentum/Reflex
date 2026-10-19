-- Elimina la función obsoleta upsert_reading_log. Se había mantenido solo
-- por compatibilidad con el cliente desplegado anterior; el cliente actual
-- usa log_reading() (ver migration_reading_history.sql).
DROP FUNCTION IF EXISTS upsert_reading_log(UUID, UUID, INTEGER, DATE);
