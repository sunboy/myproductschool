-- UI density pass foundation (spec: docs/superpowers/specs/2026-09-07-ui-density-pass-design.md)

-- 1. Runtime flag, default off. Flip per environment with:
--    update app_flags set value = 'true'::jsonb where key = 'ui_density_v1';
INSERT INTO app_flags (key, value) VALUES ('ui_density_v1', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Per-user UI preferences (nav_collapsed, practice_view). Additive, nullable-safe.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ui_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN profiles.ui_prefs IS 'UI preferences: {"nav_collapsed": bool, "practice_view": "list"|"cards"}. Written via PATCH /api/profile.';

-- 3. Reading progress for module chapters and autopsy stories.
CREATE TABLE IF NOT EXISTS reading_progress (
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT        NOT NULL CHECK (content_type IN ('module_chapter', 'autopsy_story')),
  content_id   TEXT        NOT NULL,
  parent_id    TEXT        NOT NULL,
  progress     NUMERIC(4,3) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  last_heading TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_type, content_id)
);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_updated ON reading_progress (user_id, updated_at DESC);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "reading_progress_own" ON reading_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE reading_progress IS 'Last known reading position per user per chapter/story. content_id = chapter slug or story slug; parent_id = module slug or company slug.';
