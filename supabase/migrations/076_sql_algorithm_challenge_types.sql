-- Migration 076: Replace challenge_type='coding' with first-class 'sql' and 'algorithm' types.
-- SQL challenges are identified by metadata->>'sql_schema' IS NOT NULL.

-- 1. Widen CHECK to allow new types alongside 'coding' (still present for safety during transition)
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_challenge_type_check
  CHECK (challenge_type IN (
    'flow', 'freeform', 'quick_take',
    'system_design', 'data_modeling',
    'sql', 'algorithm', 'coding'
  ));

-- 2. Backfill SQL challenges — identified by presence of sql_schema in metadata
UPDATE challenges
SET challenge_type = 'sql'
WHERE challenge_type = 'coding'
  AND metadata->>'sql_schema' IS NOT NULL;

-- 3. Backfill remaining coding rows → algorithm
UPDATE challenges
SET challenge_type = 'algorithm'
WHERE challenge_type = 'coding';

-- 4. Drop 'coding' from CHECK — no rows should have it now
ALTER TABLE challenges DROP CONSTRAINT challenges_challenge_type_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_challenge_type_check
  CHECK (challenge_type IN (
    'flow', 'freeform', 'quick_take',
    'system_design', 'data_modeling',
    'sql', 'algorithm'
  ));

-- 5. Mirror change in interview_grades CHECK
ALTER TABLE interview_grades DROP CONSTRAINT IF EXISTS interview_grades_challenge_type_check;
ALTER TABLE interview_grades ADD CONSTRAINT interview_grades_challenge_type_check
  CHECK (challenge_type IN ('system_design', 'data_modeling', 'sql', 'algorithm'));
