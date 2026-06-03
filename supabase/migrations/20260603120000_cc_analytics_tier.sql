-- Claude Code Analytics — special add-on tier (Pro super-set) + feature flag allowlist.
--
-- The analytics tier resolves to plan='pro' for every existing Pro gate (super-set),
-- plus a dedicated entitlement marker (cc_analytics_access) for the analytics feature.
-- That marker doubles as the per-user beta allowlist while the global feature flag
-- (NEXT_PUBLIC_CC_ANALYTICS_ENABLED) is still off.

-- 1. Per-user analytics entitlement / allowlist marker.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cc_analytics_access boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.cc_analytics_access IS
  'Claude Code Analytics access. Set true by the Stripe webhook for an active analytics-tier subscription, or manually to allowlist a beta user while the global feature flag is off.';

-- 2. Allow the analytics session counter as a plan_limits feature.
ALTER TABLE plan_limits
  DROP CONSTRAINT IF EXISTS plan_limits_feature_check;

ALTER TABLE plan_limits
  ADD CONSTRAINT plan_limits_feature_check
  CHECK (
    feature IN (
      'challenges',
      'interviews',
      'hatch_ai_cents',
      'hatch_chat_msgs',
      'hatch_nudges',
      'hatch_canvas_interprets',
      'simulation_turns',
      'live_interview_turns',
      'quick_takes',
      'ai_grading_runs',
      'claude_code_sessions'
    )
  );

-- 3. Seed the analytics session cap. Analytics subscribers resolve to plan='pro',
--    so the cap lives on the pro row. Free gets 0 (the tier gate blocks them first,
--    but the row keeps the matrix complete). Mirrors the FALLBACK_LIMITS in
--    src/lib/usage/check-limit.ts.
INSERT INTO plan_limits (plan, feature, limit_value, window_days, unit, description)
VALUES
  ('free', 'claude_code_sessions', 0,  30, 'count', 'Claude Code Analytics sessions per rolling month (not included)'),
  ('pro',  'claude_code_sessions', 40, 30, 'count', 'Claude Code Analytics sessions per rolling month')
ON CONFLICT (plan, feature) DO UPDATE
  SET limit_value = EXCLUDED.limit_value,
      window_days = EXCLUDED.window_days,
      unit = EXCLUDED.unit,
      description = EXCLUDED.description;
