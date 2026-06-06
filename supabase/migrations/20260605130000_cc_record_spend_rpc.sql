-- Atomic spend recording for Claude Code Analytics.
--
-- recordSessionSpend was a read-then-CAS-update followed by a SEPARATE
-- usage_events insert. The CAS prevented double-counting, but the two writes
-- weren't atomic: if the session row advanced (recorded_spend_cents = observed)
-- but the usage_events insert then failed — and recordUsageEvent swallows insert
-- errors — the spend was marked recorded forever with no matching event, a
-- permanent UNDERCOUNT. (Codex review.)
--
-- This RPC does both in one transaction: claim the delta on the session row AND
-- insert the usage_event, or neither. Returns the delta actually recorded (0 if
-- another caller already claimed it, i.e. observed <= recorded).

CREATE OR REPLACE FUNCTION record_cc_session_spend(
  p_session_id  UUID,
  p_user_id     UUID,
  p_observed_cents INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev_recorded INTEGER;
  v_delta INTEGER;
BEGIN
  -- Lock the session row so concurrent callers serialize on it.
  SELECT recorded_spend_cents INTO v_prev_recorded
  FROM claude_code_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_prev_recorded := COALESCE(v_prev_recorded, 0);
  v_delta := p_observed_cents - v_prev_recorded;

  -- Always keep observed_spend_cents monotonic for the live admin view.
  UPDATE claude_code_sessions
  SET observed_spend_cents = GREATEST(COALESCE(observed_spend_cents, 0), p_observed_cents)
  WHERE id = p_session_id;

  IF v_delta <= 0 THEN
    RETURN 0;
  END IF;

  -- Advance the recorded watermark AND insert the usage event atomically.
  UPDATE claude_code_sessions
  SET recorded_spend_cents = p_observed_cents
  WHERE id = p_session_id;

  INSERT INTO usage_events (user_id, feature, quantity, estimated_cost_cents, metadata)
  VALUES (
    p_user_id,
    'cc_claude_spend_cents',
    v_delta,
    v_delta,
    jsonb_build_object(
      'session_id', p_session_id::text,
      'observed_cents', p_observed_cents,
      'prev_recorded_cents', v_prev_recorded,
      'source', 'gateway_key_list'
    )
  );

  RETURN v_delta;
END;
$$;

COMMENT ON FUNCTION record_cc_session_spend IS
  'Atomically claim a CC Analytics session spend delta (observed - recorded) and insert the matching cc_claude_spend_cents usage_event in one transaction. Returns the delta recorded (0 if already claimed).';
