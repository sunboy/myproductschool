-- Link live interview sessions to challenge scenarios (nullable — free-form keeps NULL)
ALTER TABLE live_interview_sessions
  ADD COLUMN IF NOT EXISTS challenge_id TEXT REFERENCES challenges(id);

-- Denormalized rubric snapshot built at session start so grading doesn't re-fetch per turn
ALTER TABLE live_interview_sessions
  ADD COLUMN IF NOT EXISTS scenario_rubric JSONB;

-- Per-turn rubric alignment score
ALTER TABLE live_interview_turns
  ADD COLUMN IF NOT EXISTS rubric_alignment TEXT
    CHECK (rubric_alignment IN ('strong', 'partial', 'surface', 'off_track'));

-- Enrichment columns for company_profiles
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS interview_style TEXT;

-- Index for scenario-linked sessions
CREATE INDEX IF NOT EXISTS idx_live_sessions_challenge
  ON live_interview_sessions(challenge_id) WHERE challenge_id IS NOT NULL;
