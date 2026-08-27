-- Casebook Loop — usage_events.feature CHECK widening.
--
-- Phase 0's 20260826100200_casebook_plan_limits.sql widened plan_limits.feature
-- for 'cc_drill_sessions_weekly' (and 3 other Casebook features) but never
-- touched usage_events.feature, which has its own separate CHECK constraint.
-- Phase 3 wires practice/start's usage gate to record real usage_events rows
-- for 'cc_drill_sessions_weekly' (checkUsageLimit reads used quantity from
-- this table, not plan_limits) — without this widening, every
-- recordUsageEvent(..., 'cc_drill_sessions_weekly') insert fails the live
-- CHECK constraint, silently defeating the gate (getUsedQuantity would always
-- read 0).
--
-- Verified against the live DB (2026-08-27): the current constraint is
-- exactly the 5 keys below (pg_get_constraintdef on usage_events_feature_check),
-- matching migration 20260605120000_cc_spend_observability.sql. Re-derived here
-- rather than assumed, same as plan_limits_feature_check's own migration note.
--
-- Purely additive — widens a CHECK constraint only. No column/table changes,
-- no plan_limits row changes.
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
    'cc_drill_sessions_weekly'
  ));
