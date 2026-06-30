-- Atomic XP increment so concurrent challenge completions cannot lose an award
-- via a read-then-write race (last-writer-wins). Coding/SQL/canvas submit routes
-- call this instead of select-then-update on profiles.xp_total.
--
-- SECURITY DEFINER + service_role grant: the submit routes already use the admin
-- client for the streak RPC; this keeps XP writes off the user-writable surface.
CREATE OR REPLACE FUNCTION increment_user_xp(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total integer;
BEGIN
  IF p_amount IS NULL OR p_amount = 0 THEN
    SELECT xp_total INTO v_new_total FROM profiles WHERE id = p_user_id;
    RETURN v_new_total;
  END IF;
  UPDATE profiles
    SET xp_total = COALESCE(xp_total, 0) + p_amount
    WHERE id = p_user_id
    RETURNING xp_total INTO v_new_total;
  RETURN v_new_total;
END;
$$;

REVOKE ALL ON FUNCTION increment_user_xp(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_user_xp(uuid, integer) TO service_role;
