# Supabase Setup

## Setup inicial (proyecto nuevo)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar URL y anon key a `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. Ejecutar en SQL Editor en este orden:
   - `schema.sql` — crea todas las tablas, índices, RLS y funciones
   - `storage.sql` — crea el bucket de audio con sus políticas
4. Authentication → Providers → Email → verificar que "Enable email provider" esté activo
5. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: agregar `http://localhost:3000/auth/callback`

## Migraciones (proyecto existente)

Aplicar en orden sobre una base ya existente:

| Archivo | Descripción |
|---------|-------------|
| `migration_add_title.sql` | Agrega columna `title` a `reflections` |
| `migration_add_notes.sql` | Agrega columna `notes` a `reflections` |
| `migration_add_quotes.sql` | Crea tabla `quotes` |
| `migration_reading_tracker.sql` | Agrega `total_pages` y `current_page` a `books`, crea tabla `reading_logs` y función `upsert_reading_log` |
| `migration_add_profiles_and_roles.sql` | Crea tabla `profiles` (roles `is_admin`/`is_featured`), trigger `handle_new_user` para auto-crearla en el signup + backfill, y una FK directa `reflections`/`quotes` → `profiles` |
| `migration_add_public_content.sql` | Agrega `is_public` a `reflections`/`quotes` y las policies de lectura pública (para featured + is_public) sobre `reflections`, `quotes` y `books` |
| `migration_add_public_content_storage.sql` | Policy de Storage que permite reproducir el audio de reflexiones públicas de usuarios destacados |
| `migration_fix_profiles_rls_recursion.sql` | Corrige "infinite recursion detected in policy for relation profiles": mueve el chequeo de admin a la función `is_admin()` (`SECURITY DEFINER`) en vez de un `EXISTS` directo sobre `profiles` dentro de su propia policy |

Después de aplicar `migration_add_profiles_and_roles.sql`, otorgate admin a mano (no hay UI para el primer admin):
```sql
UPDATE profiles SET is_admin = true WHERE email = '<tu email>';
```

## Esquema actual

### `profiles`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK, FK → auth.users |
| `email` | TEXT | Duplicado de auth.users.email (no expuesto vía PostgREST) |
| `display_name` | TEXT | Nombre a mostrar (default: parte local del email) |
| `is_admin` | BOOLEAN | Acceso a `/admin/users` (default false) |
| `is_featured` | BOOLEAN | Aparece en el feed de autores destacados (default false, toggle manual desde `/admin/users`) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

Se crea automáticamente vía trigger `handle_new_user` en `auth.users` (`AFTER INSERT`). No hay policy de auto-actualización: solo un admin puede cambiar `is_admin`/`is_featured` de cualquier fila (ver RLS en `schema.sql`).

El chequeo de admin en las policies usa la función `is_admin()` (`SECURITY DEFINER`, solo ejecutable por `authenticated`) en vez de un `EXISTS` directo sobre `profiles` — una policy de `profiles` no puede referenciar `profiles` mediante un `EXISTS` plano dentro de su propio `USING`, porque Postgres vuelve a aplicar RLS a ese scan interno y entra en recursión infinita (`42P17`). La función rompe el ciclo porque su lectura interna corre con privilegios de su dueño, sin pasar RLS de nuevo.

### `books`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `title` | TEXT | Título del libro |
| `author` | TEXT | Autor (opcional) |
| `total_pages` | INTEGER | Total de páginas (opcional, para tracking) |
| `current_page` | INTEGER | Página actual leída (default 0) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

### `reflections`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `book_id` | UUID | FK → books (opcional) |
| `page_number` | INTEGER | Página de referencia (opcional) |
| `title` | TEXT | Título de la reflexión (opcional) |
| `audio_path` | TEXT | Ruta en Storage bucket |
| `duration_seconds` | INTEGER | Duración del audio |
| `tags` | TEXT[] | Array de tags |
| `notes` | TEXT | Notas escritas (opcional) |
| `is_public` | BOOLEAN | Visible en el feed si el autor es `is_featured` (default false) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

### `quotes`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `book_id` | UUID | FK → books (opcional) |
| `page_number` | INTEGER | Página de la cita (opcional) |
| `quote_text` | TEXT | Texto de la cita |
| `notes` | TEXT | Interpretación personal (opcional) |
| `tags` | TEXT[] | Array de tags |
| `is_public` | BOOLEAN | Visible en el feed si el autor es `is_featured` (default false) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

### `reading_logs`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `book_id` | UUID | FK → books |
| `pages_read` | INTEGER | Páginas leídas ese día (acumulativo) |
| `logged_at` | DATE | Fecha del registro |
| `created_at` | TIMESTAMPTZ | Timestamp de inserción |

Índice único en `(user_id, book_id, logged_at)` — un registro por libro por día.

### Función: `upsert_reading_log`
```sql
upsert_reading_log(p_user_id, p_book_id, p_pages_read, p_logged_at)
```
Inserta o acumula páginas leídas en `reading_logs`. Si ya existe un registro para ese libro/día, suma el delta en vez de reemplazar.

## Storage

Bucket `reflections` (privado):
- Max size: 50 MB
- Tipos permitidos: `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/mpeg`
- Path format: `{user_id}/{reflectionId}.{ext}`
- RLS: cada usuario accede a su carpeta, más `public_featured_audio_select` para reflexiones públicas de usuarios destacados

## Notas

- RLS habilitado en todas las tablas. Aislamiento por usuario por defecto, con una excepción explícita: contenido marcado `is_public` de usuarios `is_featured` es visible para cualquier usuario autenticado (feed de autores destacados en `/feed`).
- Para producción: reemplazar `http://localhost:3000` por la URL real del deploy
