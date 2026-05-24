-- Composite indexes for production query performance

-- challenges: filter published + sort by date
CREATE INDEX IF NOT EXISTS idx_challenges_published_created
  ON challenges (is_published, created_at DESC)
  WHERE is_published = true;

-- challenge_attempts: per-user status queries
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user_status_created
  ON challenge_attempts (user_id, status, created_at DESC);

-- interview_loops: per-user status queries
CREATE INDEX IF NOT EXISTS idx_interview_loops_user_status_created
  ON interview_loops (user_id, status, created_at DESC);

-- loop_rounds: sorted by round index within a loop
CREATE INDEX IF NOT EXISTS idx_loop_rounds_loop_round
  ON loop_rounds (loop_id, round_index);
