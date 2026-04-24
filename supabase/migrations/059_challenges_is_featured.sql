ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_challenges_featured ON challenges(is_featured) WHERE is_featured = true AND is_published = true;
COMMENT ON COLUMN challenges.is_featured IS 'Editorially pinned to the Featured section on /challenges';
