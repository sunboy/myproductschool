CREATE TABLE IF NOT EXISTS challenge_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenge_prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_expert_pick BOOLEAN NOT NULL DEFAULT FALSE,
  upvote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES challenge_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussions_challenge ON challenge_discussions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user ON challenge_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_discussion ON discussion_replies(discussion_id);

ALTER TABLE challenge_discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read all discussions" ON challenge_discussions FOR SELECT USING (true);
CREATE POLICY "Users insert own" ON challenge_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read all replies" ON discussion_replies FOR SELECT USING (true);
CREATE POLICY "Users insert own replies" ON discussion_replies FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE VIEW user_productiq AS
SELECT
  ca.user_id,
  ROUND(AVG(ca.score)::numeric, 1) AS productiq_score,
  COUNT(*) AS total_attempts,
  MAX(ca.created_at) AS last_active
FROM challenge_attempts ca
WHERE ca.score IS NOT NULL
GROUP BY ca.user_id;
