-- Security fix: lock down increment_user_xp so it is NOT executable by the
-- public anon / authenticated roles.
--
-- The original migration (20260629000000_increment_user_xp_rpc.sql) created the
-- function SECURITY DEFINER and ran `REVOKE ALL ... FROM PUBLIC`, but that does
-- NOT strip the grants Supabase auto-applies to the `anon` and `authenticated`
-- roles. Because the function is SECURITY DEFINER (bypasses RLS on profiles),
-- trusts a caller-supplied p_user_id with no auth.uid() check, and the anon key
-- ships in the client bundle, any visitor could call
--   supabase.rpc('increment_user_xp', { p_user_id: '<any uuid>', p_amount: N })
-- to mint unlimited XP on any profile (or pass a negative amount to grief one).
--
-- The function is only ever called by the submit/complete routes through the
-- service-role (admin) client, so removing anon/authenticated EXECUTE breaks
-- nothing legitimate. This mirrors update_user_streak, which is correctly
-- granted to service_role only.
REVOKE EXECUTE ON FUNCTION increment_user_xp(uuid, integer) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION increment_user_xp(uuid, integer) TO service_role;
