-- Add feedback_json to challenge_attempts so FLOW completion results
-- (step_breakdown, competency_deltas, xp_awarded) are persisted and
-- retrievable for the submission history tab.
ALTER TABLE challenge_attempts
  ADD COLUMN IF NOT EXISTS feedback_json JSONB;
