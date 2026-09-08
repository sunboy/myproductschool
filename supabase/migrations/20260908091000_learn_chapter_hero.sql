ALTER TABLE learn_chapters ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
COMMENT ON COLUMN learn_chapters.hero_image_url IS 'Optional 700x180 hero for the chapter reader; GeoArt placeholder when null.';
