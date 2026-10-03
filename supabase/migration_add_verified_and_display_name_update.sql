-- Adds a "verified" flag (admin-toggleable, shown as a feather badge next
-- to a verified author's name) and lets a user change their own public
-- display_name — through a narrow SECURITY DEFINER RPC, not a blanket
-- own-row UPDATE policy, which would let a user set their own is_admin/
-- is_featured/is_verified (see the note already in schema.sql about why
-- there's no general self-update policy on profiles).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION update_my_display_name(new_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF trim(new_name) = '' OR length(trim(new_name)) > 40 THEN
    RAISE EXCEPTION 'display_name must be 1-40 characters';
  END IF;
  UPDATE profiles SET display_name = trim(new_name) WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION update_my_display_name(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_my_display_name(TEXT) TO authenticated;
