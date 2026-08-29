-- Casebook Loop Phase 6 — usage_events.feature CHECK widening for
-- cc_terminal_minutes_weekly + cc_test_out_attempts_monthly.
--
-- Both keys were seeded into plan_limits back in Phase 0
-- (20260826100200_casebook_plan_limits.sql, and plan_limits_feature_check
-- already allows them, verified live) but usage_events has its OWN separate
-- CHECK constraint, and 20260827110000 deliberately left these two keys out
-- of it ("each gets its own migration when its phase actually starts" — that
-- phase is now, Phase 6: test-out mode + terminal-minutes enforcement).
--
-- Without this widening, every recordUsageEvent(..., 'cc_terminal_minutes_weekly')
-- or recordUsageEvent(..., 'cc_test_out_attempts_monthly') fails its CHECK on
-- insert, getUsedQuantity() always reads 0, and both gates look like
-- protection while protecting nothing. This exact failure mode has now been
-- caught 3 times before shipping in this codebase (Phase 3's practice gate,
-- Phase 4's case gate, and this one at design time).
--
-- Re-derived from the LIVE constraint (verified 2026-08-29 via
-- pg_get_constraintdef on usage_events_feature_check) rather than assumed
-- from migration files — this repo has confirmed drift between committed
-- migrations and live objects elsewhere (see challenges_difficulty_check).
--
-- Purely additive: widens a CHECK constraint only. No column or table
-- changes, no plan_limits row changes. All seven pre-existing keys are
-- preserved.

ALTER TABLE usage_events
  DROP CONSTRAINT IF EXISTS usage_events_feature_check;

ALTER TABLE usage_events
  ADD CONSTRAINT usage_events_feature_check
  CHECK (feature IN (
    'challenges',
    'interviews',
    'hatch_ai_cents',
    'claude_code_sessions',
    'cc_claude_spend_cents',
    'cc_drill_sessions_weekly',
    'cc_case_attempts_total',
    'cc_terminal_minutes_weekly',
    'cc_test_out_attempts_monthly'
  ));
