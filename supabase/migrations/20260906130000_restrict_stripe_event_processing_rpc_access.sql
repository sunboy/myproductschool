-- Repair hosted environments where Supabase granted these security-definer
-- functions directly to its client roles before the source migration was
-- hardened. Keep webhook processing available only to the service role.
REVOKE ALL ON FUNCTION claim_stripe_event(TEXT, TEXT, JSONB, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION complete_stripe_event(TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION release_stripe_event(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION record_stripe_payment_failure(TEXT, UUID, UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION claim_stripe_event(TEXT, TEXT, JSONB, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION complete_stripe_event(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION release_stripe_event(TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION record_stripe_payment_failure(TEXT, UUID, UUID, TIMESTAMPTZ) TO service_role;
