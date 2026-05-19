-- Add Claude Code analytics challenge support and session tracking.

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;

ALTER TABLE challenges ADD CONSTRAINT challenges_challenge_type_check
  CHECK (challenge_type IN (
    'flow', 'freeform', 'quick_take',
    'system_design', 'data_modeling',
    'sql', 'algorithm',
    'claude_code_analytics'
  ));

ALTER TABLE interview_grades DROP CONSTRAINT IF EXISTS interview_grades_challenge_type_check;

ALTER TABLE interview_grades ADD CONSTRAINT interview_grades_challenge_type_check
  CHECK (challenge_type IN (
    'system_design', 'data_modeling',
    'sql', 'algorithm',
    'claude_code_analytics'
  ));

CREATE TABLE IF NOT EXISTS claude_code_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id            uuid NOT NULL REFERENCES challenge_attempts(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id          text NOT NULL REFERENCES challenges(id),
  fly_machine_id        text,
  fly_app_name          text,
  status                text NOT NULL DEFAULT 'provisioning'
                        CHECK (status IN (
                          'provisioning', 'active', 'idle',
                          'terminating', 'terminated', 'failed'
                        )),
  started_at            timestamptz DEFAULT now(),
  ended_at              timestamptz,
  last_snapshot_at      timestamptz,
  transcript_uri        text,
  final_artifact        jsonb DEFAULT '{}',
  prompt_count          int DEFAULT 0,
  warehouse_query_count int DEFAULT 0,
  total_runtime_ms      int,
  total_input_tokens    int,
  total_output_tokens   int,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (attempt_id)
);

CREATE INDEX IF NOT EXISTS idx_ccs_user
  ON claude_code_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_ccs_status
  ON claude_code_sessions(status);

ALTER TABLE claude_code_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_sessions" ON claude_code_sessions;
CREATE POLICY "users_read_own_sessions" ON claude_code_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_full" ON claude_code_sessions;
CREATE POLICY "service_role_full" ON claude_code_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
