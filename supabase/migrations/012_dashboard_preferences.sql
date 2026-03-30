-- ============================================================
-- Dashboard Preferences & User Notes
-- Migration: 012_dashboard_preferences.sql
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Profile columns for dashboard customization ──────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS interview_date DATE,
  ADD COLUMN IF NOT EXISTS dashboard_cards JSONB DEFAULT '["quick_take","next_challenge","move_levels","productiq","hot_challenges","discussions","leaderboard","notes","interview_countdown","recent_activity"]'::jsonb,
  ADD COLUMN IF NOT EXISTS dismissed_cards TEXT[] DEFAULT '{}';

-- ── User notes table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'default',
  pinned BOOLEAN NOT NULL DEFAULT false,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own notes" ON user_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_notes_user_id
  ON user_notes(user_id);

CREATE INDEX IF NOT EXISTS user_notes_embedding_idx
  ON user_notes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ── RPC for semantic note search ─────────────────────────────

CREATE OR REPLACE FUNCTION match_user_notes(
  p_user_id UUID,
  p_query_embedding vector(1536),
  p_match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  color TEXT,
  pinned BOOLEAN,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    n.id,
    n.content,
    n.color,
    n.pinned,
    1 - (n.embedding <=> p_query_embedding) AS similarity
  FROM user_notes n
  WHERE n.user_id = p_user_id
    AND n.embedding IS NOT NULL
  ORDER BY n.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
