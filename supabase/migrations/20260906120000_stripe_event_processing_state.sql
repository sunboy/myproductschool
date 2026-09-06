-- Make Stripe webhook delivery retry-safe.
--
-- Existing rows came from the previous insert-before-processing implementation.
-- Treat them as processed during the compatibility upgrade: replaying historical
-- billing events without knowing which side effects already ran would be unsafe.
ALTER TABLE stripe_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processed',
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_token UUID,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS effects JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE stripe_events
SET processed_at = COALESCE(processed_at, received_at)
WHERE status = 'processed';

ALTER TABLE stripe_events
  DROP CONSTRAINT IF EXISTS stripe_events_status_check;

ALTER TABLE stripe_events
  ADD CONSTRAINT stripe_events_status_check
  CHECK (status IN ('processing', 'processed', 'failed'));

CREATE OR REPLACE FUNCTION claim_stripe_event(
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_lease_seconds INTEGER DEFAULT 120
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_event stripe_events%ROWTYPE;
  lease_duration INTERVAL := make_interval(secs => GREATEST(1, LEAST(p_lease_seconds, 900)));
  claim_token UUID := gen_random_uuid();
BEGIN
  INSERT INTO stripe_events (
    id,
    type,
    payload,
    status,
    processing_started_at,
    processing_token,
    processed_at,
    attempt_count,
    last_error
  )
  VALUES (
    p_event_id,
    p_event_type,
    p_payload,
    'processing',
    NOW(),
    claim_token,
    NULL,
    1,
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  IF FOUND THEN
    RETURN jsonb_build_object('status', 'claimed', 'token', claim_token);
  END IF;

  SELECT *
  INTO current_event
  FROM stripe_events
  WHERE id = p_event_id
  FOR UPDATE;

  IF current_event.status = 'processed' THEN
    RETURN jsonb_build_object('status', 'processed');
  END IF;

  IF current_event.status = 'processing'
     AND current_event.processing_started_at IS NOT NULL
     AND current_event.processing_started_at > NOW() - lease_duration THEN
    RETURN jsonb_build_object('status', 'in_progress');
  END IF;

  UPDATE stripe_events
  SET
    type = p_event_type,
    payload = p_payload,
    status = 'processing',
    processing_started_at = NOW(),
    processing_token = claim_token,
    processed_at = NULL,
    attempt_count = attempt_count + 1,
    last_error = NULL
  WHERE id = p_event_id;

  RETURN jsonb_build_object('status', 'claimed', 'token', claim_token);
END;
$$;

CREATE OR REPLACE FUNCTION complete_stripe_event(
  p_event_id TEXT,
  p_processing_token UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stripe_events
  SET
    status = 'processed',
    processed_at = NOW(),
    processing_started_at = NULL,
    processing_token = NULL,
    last_error = NULL
  WHERE id = p_event_id
    AND status = 'processing'
    AND processing_token = p_processing_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stripe event % does not hold a processing lease', p_event_id;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION release_stripe_event(
  p_event_id TEXT,
  p_processing_token UUID,
  p_error TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stripe_events
  SET
    status = 'failed',
    processing_started_at = NULL,
    processing_token = NULL,
    last_error = LEFT(p_error, 2000)
  WHERE id = p_event_id
    AND status = 'processing'
    AND processing_token = p_processing_token;

  RETURN FOUND;
END;
$$;

-- Apply the incremental payment-failure effect once per Stripe event. The event
-- can then be released and retried safely if a later operation fails.
CREATE OR REPLACE FUNCTION record_stripe_payment_failure(
  p_event_id TEXT,
  p_processing_token UUID,
  p_user_id UUID,
  p_failed_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_effects JSONB;
BEGIN
  SELECT effects
  INTO current_effects
  FROM stripe_events
  WHERE id = p_event_id
    AND status = 'processing'
    AND processing_token = p_processing_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stripe event % does not hold a processing lease', p_event_id;
  END IF;

  IF current_effects ? 'payment_failure_recorded' THEN
    RETURN FALSE;
  END IF;

  UPDATE profiles
  SET
    payment_failures = COALESCE(payment_failures, 0) + 1,
    subscription_status = 'past_due',
    past_due_since = COALESCE(past_due_since, p_failed_at)
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found for Stripe payment failure', p_user_id;
  END IF;

  UPDATE stripe_events
  SET effects = effects || jsonb_build_object(
    'payment_failure_recorded',
    jsonb_build_object('user_id', p_user_id, 'recorded_at', NOW())
  )
  WHERE id = p_event_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION claim_stripe_event(TEXT, TEXT, JSONB, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION complete_stripe_event(TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION release_stripe_event(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION record_stripe_payment_failure(TEXT, UUID, UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION claim_stripe_event(TEXT, TEXT, JSONB, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION complete_stripe_event(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION release_stripe_event(TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION record_stripe_payment_failure(TEXT, UUID, UUID, TIMESTAMPTZ) TO service_role;
