-- Migration 070: Interview Challenges — System Design + Data Modeling
-- Extends existing tables to support canvas-based interview challenge types.
-- Does NOT create parallel tables — extends challenge_type enum and existing attempts table.

-- 1. Extend challenge_type enum to include interview types
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_challenge_type_check
  CHECK (challenge_type IN ('flow', 'freeform', 'quick_take', 'system_design', 'data_modeling'));

-- 2. Add metadata JSONB to challenges for type-specific data
-- system_design: { requirements, required_components, scalability_signals, reference_diagram_description, time_limit_seconds }
-- data_modeling: { requirements, required_entities, modeling_signals, reference_schema_description, time_limit_seconds }
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Extend challenge_attempts for interview session state
-- (challenge_attempts_v2 was renamed to challenge_attempts in migration 028)
ALTER TABLE challenge_attempts
  ADD COLUMN IF NOT EXISTS canvas_final_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS draft_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS draft_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS conversation_summary TEXT;

-- 4. New table: interview_grades
-- Stores structured grading output for system_design and data_modeling challenges.
-- FLOW challenges use step_attempts + challenge_attempts; this is a separate concern.
CREATE TABLE IF NOT EXISTS interview_grades (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id          UUID NOT NULL REFERENCES challenge_attempts(id) ON DELETE CASCADE,
  challenge_type      TEXT NOT NULL CHECK (challenge_type IN ('system_design', 'data_modeling')),
  overall_score       NUMERIC(3,1),
  headline            TEXT,
  rubric_scores       JSONB NOT NULL DEFAULT '{}',
  top_strength        TEXT,
  top_improvement     TEXT,
  canvas_annotations  JSONB DEFAULT '[]',
  graded_at           TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interview_grades ENABLE ROW LEVEL SECURITY;

-- RLS: mirror challenge_attempts pattern (users can only see their own grades)
CREATE POLICY "Users can view own interview grades"
  ON interview_grades FOR SELECT
  USING (
    attempt_id IN (
      SELECT id FROM challenge_attempts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own interview grades"
  ON interview_grades FOR INSERT
  WITH CHECK (
    attempt_id IN (
      SELECT id FROM challenge_attempts WHERE user_id = auth.uid()
    )
  );

-- Service role can do anything (for server-side grading)
CREATE POLICY "Service role full access to interview grades"
  ON interview_grades FOR ALL
  USING (auth.role() = 'service_role');
