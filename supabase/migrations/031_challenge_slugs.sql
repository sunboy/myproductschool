-- Add slug column derived from id by stripping leading c{N}- prefix
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE challenges SET slug = regexp_replace(id, '^c[0-9]+-', '') WHERE slug IS NULL;

ALTER TABLE challenges ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS challenges_slug_idx ON challenges (slug);
