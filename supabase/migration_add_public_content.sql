-- Featured-authors feed: lets a user opt a specific reflection/quote into
-- being public, visible to any authenticated user IF the author's profile
-- is is_featured = true. Requires migration_add_profiles_and_roles.sql
-- to have run first.

ALTER TABLE reflections ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE quotes      ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_reflections_public ON reflections(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_quotes_public      ON quotes(is_public)      WHERE is_public = true;

CREATE POLICY "featured_public_reflections_select_authenticated" ON reflections FOR SELECT TO authenticated
  USING (
    is_public = true
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = reflections.user_id AND p.is_featured = true)
  );

CREATE POLICY "featured_public_quotes_select_authenticated" ON quotes FOR SELECT TO authenticated
  USING (
    is_public = true
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = quotes.user_id AND p.is_featured = true)
  );

-- Required or the feed's embedded books(id,title,author) join silently
-- returns null: PostgREST checks RLS on the embedded table independently
-- of the parent row's own policy passing.
--
-- Tradeoff, deliberate: RLS is row-level, not column-level, so this makes
-- the ENTIRE books row (not just id/title/author) readable by any
-- authenticated user via a direct query, for any book with at least one
-- public reflection/quote from a featured user. The feed UI only ever
-- requests id/title/author, but a direct `select("*")` would see
-- current_page/total_pages/created_at too. Accepted at this app's
-- personal scale.
CREATE POLICY "public_featured_books_select" ON books FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM reflections r WHERE r.book_id = books.id AND r.is_public = true)
    OR EXISTS (SELECT 1 FROM quotes q WHERE q.book_id = books.id AND q.is_public = true)
  );
