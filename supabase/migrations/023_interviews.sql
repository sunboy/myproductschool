CREATE TABLE IF NOT EXISTS user_interviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_date DATE NOT NULL,
  company     TEXT,
  round       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own interviews" ON user_interviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_interviews_user_date
  ON user_interviews(user_id, interview_date);
