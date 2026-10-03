-- Decouples "visible to others" from "featured": any user can share a
-- reflection/quote to their own profile by marking it is_public, whether
-- or not an admin has featured them. is_featured now only controls
-- curation of the /feed index (the "destacados" leaderboard) — not
-- visibility of an individual's own public content on their profile page.

DROP POLICY IF EXISTS "featured_public_reflections_select_authenticated" ON reflections;
CREATE POLICY "public_reflections_select_authenticated" ON reflections FOR SELECT TO authenticated
  USING (is_public = true);

DROP POLICY IF EXISTS "featured_public_quotes_select_authenticated" ON quotes;
CREATE POLICY "public_quotes_select_authenticated" ON quotes FOR SELECT TO authenticated
  USING (is_public = true);

-- New: a profile is visible to other authenticated users if that user has
-- at least one public reflection/quote — mirrors the existing
-- public_featured_books_select pattern. One-directional (profiles reads
-- reflections/quotes; reflections/quotes no longer read profiles at all
-- after the two policies above), so there's no recursion risk here.
CREATE POLICY "public_authors_select_authenticated" ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM reflections r WHERE r.user_id = profiles.id AND r.is_public = true)
    OR EXISTS (SELECT 1 FROM quotes q WHERE q.user_id = profiles.id AND q.is_public = true)
  );
