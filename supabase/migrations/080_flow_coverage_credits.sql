-- 080_flow_coverage_credits.sql
--
-- Per-turn dedup registry for flow_coverage increments. Three writers
-- (/analyze, /turn, /grade-turn) each push +0.15 to a move; without a registry,
-- a single user turn could be credited multiple times if more than one writer
-- fires. We track which (move, turn_index) pairs have already been credited.

ALTER TABLE live_interview_sessions
  ADD COLUMN IF NOT EXISTS flow_coverage_credits JSONB NOT NULL
  DEFAULT '{"frame":[],"list":[],"optimize":[],"win":[]}';
