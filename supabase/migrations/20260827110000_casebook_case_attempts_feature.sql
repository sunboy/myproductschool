-- Casebook Loop — usage_events.feature CHECK widening for case-session metering.
--
-- Phase 0 seeded `cc_case_attempts_total` in plan_limits (free: 1 lifetime,
-- pro: 10000) but `usage_events` has its OWN separate CHECK constraint. Phase 3's
-- migration (20260827100000) widened it for `cc_drill_sessions_weekly` only.
--
-- Without this widening, every recordUsageEvent(..., 'cc_case_attempts_total')
-- fails its CHECK on insert, getUsedQuantity() always reads 0, and the case gate
-- can never fire — a gate that looks like protection while protecting nothing.
-- That exact failure mode was caught twice before shipping (Phase 3's practice
-- gate, and this one at design time), so it is called out here explicitly.
--
-- Re-derived from the LIVE constraint (pg_get_constraintdef on
-- usage_events_feature_check, verified 2026-08-27 by both the orchestrator and
-- the coordinator independently) rather than assumed from the migration files —
-- this repo has confirmed drift between committed migrations and live objects
-- (see challenges_difficulty_check).
--
-- SCOPE: one key only. `cc_terminal_minutes_weekly` and
-- `cc_test_out_attempts_monthly` are also seeded-but-unwired Phase 0 keys, and
-- are deliberately NOT added here. Widening a CHECK with no wiring behind it just
-- recreates dead config one layer down; each gets its own migration when its
-- phase actually starts.
--
-- Purely additive: widens a CHECK constraint only. No column or table changes,
-- no plan_limits row changes. All six pre-existing keys are preserved.

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
    'cc_case_attempts_total'
  ));
