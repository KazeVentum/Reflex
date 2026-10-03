-- Fixes "infinite recursion detected in policy for relation profiles"
-- (Postgres error 42P17), which broke every query touching profiles,
-- reflections, quotes and books (all transitively reference profiles via
-- the featured-content policies). Root cause: admins_select_all_profiles
-- and admins_update_all_profiles referenced profiles via a plain EXISTS
-- subquery inside their own USING/WITH CHECK clause — Postgres re-applies
-- RLS to that subquery's scan of profiles, which re-includes the same
-- policy, recursing without a terminating base case at the planner level.
-- Confirmed via a simulated `SET LOCAL ROLE authenticated` query before
-- and after this fix.
--
-- Fix: move the admin check into a SECURITY DEFINER function, which
-- bypasses RLS for its own internal lookup and breaks the recursive cycle
-- (the standard Supabase-recommended pattern for this situation).

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- Supabase auto-grants EXECUTE on new public functions to anon/
-- authenticated; only `authenticated` needs this (anon has no auth.uid()
-- anyway, so it would just always return false, but no reason to expose it).
REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

DROP POLICY IF EXISTS "admins_select_all_profiles" ON profiles;
CREATE POLICY "admins_select_all_profiles" ON profiles FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
CREATE POLICY "admins_update_all_profiles" ON profiles FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
