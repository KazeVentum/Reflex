-- Roles: adds a `profiles` table (admin/featured flags), a signup trigger
-- to keep it in sync with auth.users, and a direct FK from
-- reflections/quotes to profiles (needed for PostgREST embedding later).

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  display_name TEXT,
  is_admin     BOOLEAN     NOT NULL DEFAULT false,
  is_featured  BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Supabase auto-grants EXECUTE on new public functions to anon/authenticated,
-- which turns any SECURITY DEFINER function into a public RPC endpoint
-- (confirmed via `supabase db advisors` / get_advisors after applying this
-- migration). handle_new_user is a trigger function (RETURNS TRIGGER) — a
-- direct RPC call to it always errors since NEW/trigger context only
-- exists inside a real trigger invocation — but revoking the unnecessary
-- public surface is still correct per Supabase's own security checklist.
-- Trigger invocation itself is unaffected: it isn't subject to this ACL.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Backfill profiles for users that already existed before this migration.
INSERT INTO public.profiles (id, email, display_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- A second, direct FK to profiles(id) — PostgREST's embedded-resource
-- syntax needs a direct FK to discover the relationship; a shared
-- reference to auth.users isn't enough.
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile_select" ON profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "featured_profiles_select_authenticated" ON profiles FOR SELECT TO authenticated
  USING (is_featured = true);

-- Recursion-safe: this subquery only ever looks up the caller's own row
-- (admin_row.id = auth.uid()), which is unconditionally visible via
-- users_own_profile_select above — a bounded, self-resolving lookup, not
-- open recursion.
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

-- No self-service update policy on purpose: RLS is row-scoped, not
-- column-scoped, so a blanket "own row" UPDATE policy would let any user
-- set their own is_admin/is_featured. Add one later only via a
-- SECURITY DEFINER RPC or column-level GRANTs if self-editable fields
-- (e.g. display_name) are ever needed.

-- After running this migration, grant yourself admin manually:
-- UPDATE profiles SET is_admin = true WHERE email = '<your email>';
