-- 063_autopsy_bookmarks.sql
-- Per-user bookmarks for autopsy stories.
-- Count is hidden from the UI in Phase 1 but the data model is complete.

CREATE TABLE IF NOT EXISTS autopsy_bookmarks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_slug text NOT NULL,
  story_slug   text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_slug, story_slug)
);

-- Index: find all bookmarks for a user quickly
CREATE INDEX IF NOT EXISTS idx_autopsy_bookmarks_user
  ON autopsy_bookmarks(user_id, created_at DESC);

-- Convenience view: bookmark counts per story (aggregate, no user data)
CREATE OR REPLACE VIEW autopsy_story_bookmark_counts AS
  SELECT
    company_slug,
    story_slug,
    COUNT(*) AS bookmark_count
  FROM autopsy_bookmarks
  GROUP BY company_slug, story_slug;

-- Row-level security
ALTER TABLE autopsy_bookmarks ENABLE ROW LEVEL SECURITY;

-- Users may read their own bookmarks only
CREATE POLICY "bookmarks_own_read"
  ON autopsy_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Users may insert their own bookmarks
CREATE POLICY "bookmarks_own_insert"
  ON autopsy_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users may delete their own bookmarks
CREATE POLICY "bookmarks_own_delete"
  ON autopsy_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Service role gets full access
CREATE POLICY "bookmarks_service_all"
  ON autopsy_bookmarks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
