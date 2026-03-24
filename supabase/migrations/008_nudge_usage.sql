CREATE TABLE IF NOT EXISTS nudge_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nudge_usage_attempt_idx ON nudge_usage(user_id, attempt_id);

ALTER TABLE nudge_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own nudges" ON nudge_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages nudges" ON nudge_usage FOR ALL USING (auth.role() = 'service_role');
