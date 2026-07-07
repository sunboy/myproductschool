-- The debugging lab: second Claude Code lab type, flag-gated dark.
-- Additive only: widens the challenge_type CHECK constraints and inserts the
-- lab_debugging app flag (default false → invisible on prod until flipped).

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;

ALTER TABLE challenges ADD CONSTRAINT challenges_challenge_type_check
  CHECK (challenge_type IN (
    'flow', 'freeform', 'quick_take',
    'system_design', 'data_modeling',
    'sql', 'algorithm',
    'claude_code_analytics',
    'claude_code_debugging'
  ));

ALTER TABLE interview_grades DROP CONSTRAINT IF EXISTS interview_grades_challenge_type_check;

ALTER TABLE interview_grades ADD CONSTRAINT interview_grades_challenge_type_check
  CHECK (challenge_type IN (
    'system_design', 'data_modeling',
    'sql', 'algorithm',
    'claude_code_analytics',
    'claude_code_debugging'
  ));

INSERT INTO app_flags (key, value)
VALUES ('lab_debugging', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
