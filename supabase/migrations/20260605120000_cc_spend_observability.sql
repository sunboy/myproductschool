-- CC Analytics spend observability
--
-- Adds the plumbing to MEASURE per-user Claude spend for Claude Code Analytics,
-- so we can alert (and later cap) on it. Spend is read from the LiteLLM gateway
-- /key/list (per-session key spend, which persists past the key's TTL) at teardown
-- and by a backstop cron, then rolled into a per-user 30-day rolling total.
--
-- Purely additive + observational — no behavior change.

-- 1. usage_events.feature enum: add cc_claude_spend_cents (the per-user spend
--    accumulator). Also include 'claude_code_sessions' (the session-count event
--    the start route already records) which the live CHECK was missing.
ALTER TABLE usage_events DROP CONSTRAINT IF EXISTS usage_events_feature_check;
ALTER TABLE usage_events
  ADD CONSTRAINT usage_events_feature_check
  CHECK (feature IN (
    'challenges',
    'interviews',
    'hatch_ai_cents',
    'claude_code_sessions',
    'cc_claude_spend_cents'
  ));

-- 2. Per-session spend tracking on claude_code_sessions.
--    observed_spend_cents : latest spend read from the gateway (monotonic max).
--    recorded_spend_cents : how much of observed has already been rolled into the
--                           per-user usage_events total — delta = observed - recorded
--                           is what each capture adds, so re-running never double counts.
ALTER TABLE claude_code_sessions
  ADD COLUMN IF NOT EXISTS observed_spend_cents INTEGER,
  ADD COLUMN IF NOT EXISTS recorded_spend_cents INTEGER NOT NULL DEFAULT 0;

-- 3. Index for the rolling-window per-user spend sum.
CREATE INDEX IF NOT EXISTS idx_usage_events_user_feature_created
  ON usage_events (user_id, feature, created_at);

-- 4. Admin read-model: per-user CC Claude spend over the last 30 days.
CREATE OR REPLACE VIEW cc_user_spend_30d AS
SELECT
  ue.user_id,
  ROUND(SUM(ue.quantity) / 100.0, 2)            AS spend_usd_30d,
  SUM(ue.quantity)                              AS spend_cents_30d,
  COUNT(*)                                      AS spend_events_30d,
  MAX(ue.quantity)                              AS max_single_event_cents,
  MAX(ue.created_at)                            AS last_spend_at
FROM usage_events ue
WHERE ue.feature = 'cc_claude_spend_cents'
  AND ue.created_at >= NOW() - INTERVAL '30 days'
GROUP BY ue.user_id;

COMMENT ON VIEW cc_user_spend_30d IS
  'Per-user Claude Code Analytics spend (cc_claude_spend_cents) over a rolling 30 days. Data source for spend alerts and the future monthly cap.';
