-- ============================================================
-- MyProductSchool — Failure Pattern Detection
-- Migration: 003_failure_patterns.sql
-- Adds user_failure_patterns table, pattern_summary view,
-- and confidence_rating column to challenge_attempts
-- ============================================================

-- user_failure_patterns table
CREATE TABLE IF NOT EXISTS user_failure_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES challenge_attempts(id) ON DELETE SET NULL,
  pattern_id TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence TEXT NOT NULL,
  question TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_patterns ON user_failure_patterns(user_id, pattern_id);
CREATE INDEX IF NOT EXISTS idx_attempt_patterns ON user_failure_patterns(attempt_id);

-- pattern_summary view
CREATE OR REPLACE VIEW user_pattern_summary AS
SELECT
  user_id,
  pattern_id,
  pattern_name,
  COUNT(*) AS occurrence_count,
  MAX(created_at) AS last_seen,
  AVG(confidence) AS avg_confidence
FROM user_failure_patterns
GROUP BY user_id, pattern_id, pattern_name;

-- RLS
ALTER TABLE user_failure_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own patterns"
  ON user_failure_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role insert patterns"
  ON user_failure_patterns FOR INSERT
  WITH CHECK (true);

-- Add confidence_rating to challenge_attempts (nullable, 1-5)
ALTER TABLE challenge_attempts
  ADD COLUMN IF NOT EXISTS confidence_rating INT CHECK (confidence_rating >= 1 AND confidence_rating <= 5);
