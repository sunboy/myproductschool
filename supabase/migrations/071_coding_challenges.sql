-- Migration 071: Coding Challenges — extend schema for 'coding' challenge type
-- Extends migration 070 (interview challenges) to support Monaco-based coding interviews.
-- Does NOT create parallel tables — extends existing CHECK constraints and challenge_attempts.

-- 1. Extend challenge_type CHECK to include 'coding' alongside existing types
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_challenge_type_check
  CHECK (challenge_type IN ('flow', 'freeform', 'quick_take', 'system_design', 'data_modeling', 'coding'));

-- 2. Extend interview_grades.challenge_type CHECK to include 'coding'
-- Drop and recreate the inline CHECK via a table-level constraint pattern
DO $$
BEGIN
  -- Remove existing check on challenge_type column in interview_grades
  ALTER TABLE interview_grades DROP CONSTRAINT IF EXISTS interview_grades_challenge_type_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE interview_grades ADD CONSTRAINT interview_grades_challenge_type_check
  CHECK (challenge_type IN ('system_design', 'data_modeling', 'coding'));

-- 3. Extend challenge_attempts with coding-specific columns
ALTER TABLE challenge_attempts
  ADD COLUMN IF NOT EXISTS final_code TEXT,
  ADD COLUMN IF NOT EXISTS final_language TEXT,
  ADD COLUMN IF NOT EXISTS test_results JSONB;
