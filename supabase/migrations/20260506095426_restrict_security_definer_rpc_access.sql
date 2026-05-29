REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_quota_if_due(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.search_artifacts(text, text, text, text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_quota_if_due(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_artifacts(text, text, text, text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_streak(uuid) TO service_role;
