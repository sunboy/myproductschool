-- 062_autopsy_reading_paths.sql
-- Curated reading paths: ordered lists of autopsy stories grouped by theme.
-- Paths are admin-curated (no user creation in Phase 1).

CREATE TABLE IF NOT EXISTS autopsy_reading_paths (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  dek         text NOT NULL,
  cover_emoji text NOT NULL DEFAULT '📖',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS autopsy_reading_path_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id         uuid NOT NULL REFERENCES autopsy_reading_paths(id) ON DELETE CASCADE,
  company_slug    text NOT NULL,
  story_slug      text NOT NULL,
  position        integer NOT NULL,  -- 1-based ordering within the path
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (path_id, position),
  UNIQUE (path_id, company_slug, story_slug)
);

-- Index for path item lookups
CREATE INDEX IF NOT EXISTS idx_reading_path_items_path_id
  ON autopsy_reading_path_items(path_id, position);

-- Row-level security: reading paths are public read, admin write only
ALTER TABLE autopsy_reading_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopsy_reading_path_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reading_paths_public_read"
  ON autopsy_reading_paths FOR SELECT
  USING (true);

CREATE POLICY "reading_path_items_public_read"
  ON autopsy_reading_path_items FOR SELECT
  USING (true);

-- Service role (admin) gets full access
CREATE POLICY "reading_paths_service_all"
  ON autopsy_reading_paths FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "reading_path_items_service_all"
  ON autopsy_reading_path_items FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
