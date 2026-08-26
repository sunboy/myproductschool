-- Casebook Loop — plan_limits additions.
--
-- Adds 4 new plan_limits features for the Casebook loop (CC drill sessions, case
-- attempts, terminal minutes, test-out attempts) and widens the CHECK constraint on
-- plan_limits.feature to allow them.
--
-- IMPORTANT: plan_limits.feature is CHECK-constrained. The live database's existing
-- allowlist (14 keys) is NOT fully reflected in the migrations directory — the
-- careerops_* keys were added out-of-band and are missing from any migration file
-- here. This migration re-derives the constraint from the LIVE allowlist (verified
-- against the running DB), not from what earlier migration files imply, so that
-- re-applying this DROP+ADD never narrows the constraint and silently breaks a live
-- production feature (careerops_*, claude_code_sessions, etc).

-- 1. Widen the CHECK constraint: 14 existing live keys + 4 new Casebook keys.
ALTER TABLE plan_limits
  DROP CONSTRAINT IF EXISTS plan_limits_feature_check;

ALTER TABLE plan_limits
  ADD CONSTRAINT plan_limits_feature_check
  CHECK (
    feature IN (
      -- Existing (14) — verified against the live DB. Do not remove any of these.
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
      'claude_code_sessions',
      'careerops_fit_scores',
      'careerops_feed_scores',
      'careerops_resume_tailors',
      -- New (4) — Casebook loop.
      'cc_drill_sessions_weekly',
      'cc_case_attempts_total',
      'cc_terminal_minutes_weekly',
      'cc_test_out_attempts_monthly'
    )
  );

-- 2. Seed the 4 Casebook features x 2 plans (free, pro).
--
-- window_days reasoning:
--   - cc_drill_sessions_weekly / cc_terminal_minutes_weekly: rolling 7-day window
--     (weekly features).
--   - cc_test_out_attempts_monthly: rolling 30-day window (monthly feature).
--   - cc_case_attempts_total is nominally a LIFETIME cap, but checkUsageLimit
--     (src/lib/usage/check-limit.ts) is strictly rolling-window and has no concept
--     of "lifetime". 36500 days (~100 years) approximates lifetime by making the
--     window effectively never roll off in practice. True lifetime semantics
--     (e.g. a dedicated non-windowed counter) arrive with the Casebook gate logic
--     in a later phase.
--
-- pro limit_value note: the plan doc's original "-1 = unlimited" convention is
-- WRONG for this codebase. checkUsageLimit computes
-- `allowed = used + nextQuantity <= limit` with no special case for -1, so a -1 row
-- would mean "zero allowed" and hard-block every Pro user. Confirmed against the
-- live DB: all existing rows use high finite numbers for pro, none use -1. This
-- migration follows that convention with high finite pro values.
INSERT INTO plan_limits (plan, feature, limit_value, window_days, unit, description)
VALUES
  ('free', 'cc_drill_sessions_weekly',     3,     7,     'count', 'Casebook drill sessions per rolling week'),
  ('pro',  'cc_drill_sessions_weekly',     500,   7,     'count', 'Casebook drill sessions per rolling week'),
  ('free', 'cc_case_attempts_total',       1,     36500, 'count', 'Casebook case attempts (approximated lifetime cap; see gate logic in a later phase)'),
  ('pro',  'cc_case_attempts_total',       10000, 36500, 'count', 'Casebook case attempts (approximated lifetime cap; see gate logic in a later phase)'),
  ('free', 'cc_terminal_minutes_weekly',   45,    7,     'count', 'Casebook terminal minutes per rolling week'),
  ('pro',  'cc_terminal_minutes_weekly',   10000, 7,     'count', 'Casebook terminal minutes per rolling week'),
  ('free', 'cc_test_out_attempts_monthly', 0,     30,    'count', 'Casebook test-out attempts per rolling month (not included)'),
  ('pro',  'cc_test_out_attempts_monthly', 5,     30,    'count', 'Casebook test-out attempts per rolling month')
ON CONFLICT (plan, feature) DO UPDATE
  SET limit_value = EXCLUDED.limit_value,
      window_days = EXCLUDED.window_days,
      unit = EXCLUDED.unit,
      description = EXCLUDED.description;
