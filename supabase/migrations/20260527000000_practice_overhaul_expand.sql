-- ============================================================================
-- Migration A: Practice Overhaul — Expand + Backfill
-- ============================================================================
-- Goal: collapse challenge & learn_module difficulty to {easy, medium, hard},
-- normalize taxonomy, and add metadata for the LeetCode-style Practice UI.
-- This migration is ADDITIVE only — legacy columns (industry, sub_vertical,
-- frameworks, tags) stay intact and are dropped in a follow-up (R3) once
-- telemetry confirms no read path still hits them.
--
-- Pre-flight Codex review: passed (session 019e6850; verdict yes-ship + RLS
-- + transaction guidance applied).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. challenges.difficulty: warmup/standard/advanced/staff_plus -> easy/medium/hard
-- ----------------------------------------------------------------------------

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_difficulty_check;

UPDATE challenges SET difficulty = CASE difficulty
    WHEN 'warmup'     THEN 'easy'
    WHEN 'standard'   THEN 'medium'
    WHEN 'advanced'   THEN 'hard'
    WHEN 'staff_plus' THEN 'hard'
    ELSE difficulty
END
WHERE difficulty IN ('warmup', 'standard', 'advanced', 'staff_plus');

-- Sanity check before re-adding the CHECK
DO $$
DECLARE
  bad_count INT;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM challenges WHERE difficulty NOT IN ('easy','medium','hard');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'challenges.difficulty has % rows not in (easy,medium,hard) after backfill', bad_count;
  END IF;
END$$;

ALTER TABLE challenges ADD CONSTRAINT challenges_difficulty_check
  CHECK (difficulty IN ('easy','medium','hard'));

-- Staging columns for Phase 3 bulk re-grading + tag suggestion pass
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS difficulty_suggested TEXT,
  ADD COLUMN IF NOT EXISTS industry_tags_suggested TEXT[] DEFAULT '{}';

-- ----------------------------------------------------------------------------
-- 2. learn_modules.difficulty -> easy/medium/hard + level_track
-- ----------------------------------------------------------------------------

ALTER TABLE learn_modules DROP CONSTRAINT IF EXISTS learn_modules_difficulty_check;

-- Preserve the original semantic in level_track before we collapse difficulty.
ALTER TABLE learn_modules
  ADD COLUMN IF NOT EXISTS level_track TEXT;

UPDATE learn_modules SET level_track = CASE difficulty
    WHEN 'foundation'  THEN 'foundation'
    WHEN 'beginner'    THEN 'core'
    WHEN 'intermediate' THEN 'core'
    WHEN 'advanced'    THEN 'core'
    WHEN 'new-era'     THEN 'new-era'
    WHEN 'entry-point' THEN 'entry-point'
    ELSE 'core'
END
WHERE level_track IS NULL;

UPDATE learn_modules SET difficulty = CASE difficulty
    WHEN 'foundation'  THEN 'easy'
    WHEN 'beginner'    THEN 'easy'
    WHEN 'intermediate' THEN 'medium'
    WHEN 'advanced'    THEN 'hard'
    WHEN 'new-era'     THEN 'medium'
    WHEN 'entry-point' THEN 'easy'
    ELSE difficulty
END
WHERE difficulty NOT IN ('easy','medium','hard');

DO $$
DECLARE
  bad_count INT;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM learn_modules WHERE difficulty NOT IN ('easy','medium','hard');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'learn_modules.difficulty has % rows not in (easy,medium,hard) after backfill', bad_count;
  END IF;
END$$;

ALTER TABLE learn_modules ADD CONSTRAINT learn_modules_difficulty_check
  CHECK (difficulty IN ('easy','medium','hard'));

-- Repair any pre-existing non-null level_track values that don't match the new domain.
UPDATE learn_modules
SET level_track = 'core'
WHERE level_track IS NOT NULL
  AND level_track NOT IN ('foundation','core','new-era','entry-point');

ALTER TABLE learn_modules DROP CONSTRAINT IF EXISTS learn_modules_level_track_check;
ALTER TABLE learn_modules ADD CONSTRAINT learn_modules_level_track_check
  CHECK (level_track IN ('foundation','core','new-era','entry-point'));

-- ----------------------------------------------------------------------------
-- 3. autopsy_decisions and weekly_rooms — relax difficulty CHECK
-- ----------------------------------------------------------------------------
-- These tables share the difficulty vocabulary but don't have legacy rows we
-- need to rewrite. Just widen the CHECK so they accept easy/medium/hard.

ALTER TABLE autopsy_decisions DROP CONSTRAINT IF EXISTS autopsy_decisions_difficulty_check;
ALTER TABLE autopsy_decisions ADD CONSTRAINT autopsy_decisions_difficulty_check
  CHECK (difficulty IN ('easy','medium','hard','warmup','standard','advanced','staff_plus'));

ALTER TABLE weekly_rooms DROP CONSTRAINT IF EXISTS weekly_rooms_difficulty_check;
ALTER TABLE weekly_rooms ADD CONSTRAINT weekly_rooms_difficulty_check
  CHECK (difficulty IN ('easy','medium','hard','beginner','intermediate','advanced','warmup','standard','staff_plus'));

-- ----------------------------------------------------------------------------
-- 4. topics + techniques table extensions
-- ----------------------------------------------------------------------------

ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS applies_to_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS challenge_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_chapter_label TEXT;

ALTER TABLE techniques
  ADD COLUMN IF NOT EXISTS applies_to_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS challenge_count INT DEFAULT 0;

-- Backfill topics.title where NULL — derive a human label from the slug so
-- section headers render correctly even when the seed forgot to set title.
UPDATE topics
SET title = initcap(replace(slug, '-', ' '))
WHERE title IS NULL OR title = '';

-- Set default_chapter_label = title for any topic still without one.
UPDATE topics SET default_chapter_label = title WHERE default_chapter_label IS NULL;

-- GIN indexes for the new arrays
CREATE INDEX IF NOT EXISTS idx_topics_applies_to_types ON topics USING GIN (applies_to_types);
CREATE INDEX IF NOT EXISTS idx_techniques_applies_to_types ON techniques USING GIN (applies_to_types);

-- ----------------------------------------------------------------------------
-- 5. challenges.industry_tags (additive — does not drop industry/sub_vertical)
-- ----------------------------------------------------------------------------

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS industry_tags TEXT[] DEFAULT '{}';

-- Normalize industry + sub_vertical into a single lowercase-kebab array.
-- Examples: 'Technology' -> 'technology', 'AI Infrastructure' -> 'ai-infrastructure'
UPDATE challenges
SET industry_tags = (
  SELECT array_agg(DISTINCT t) FILTER (WHERE t IS NOT NULL AND t <> '')
  FROM (
    SELECT lower(regexp_replace(trim(industry),    '[^a-zA-Z0-9]+', '-', 'g')) AS t WHERE industry    IS NOT NULL
    UNION ALL
    SELECT lower(regexp_replace(trim(sub_vertical),'[^a-zA-Z0-9]+', '-', 'g'))      WHERE sub_vertical IS NOT NULL
  ) s
)
WHERE (industry IS NOT NULL OR sub_vertical IS NOT NULL)
  AND (industry_tags IS NULL OR cardinality(industry_tags) = 0);

-- Strip any leading/trailing dashes left by the regex on punctuation-heavy inputs.
-- Apply DISTINCT after stripping so 'foo' and 'foo!' (both → 'foo') don't dupe.
UPDATE challenges
SET industry_tags = ARRAY(
  SELECT DISTINCT regexp_replace(t, '^-+|-+$', '', 'g')
  FROM unnest(industry_tags) t
  WHERE regexp_replace(t, '^-+|-+$', '', 'g') <> ''
)
WHERE cardinality(industry_tags) > 0;

CREATE INDEX IF NOT EXISTS idx_challenges_industry_tags ON challenges USING GIN (industry_tags);

-- ----------------------------------------------------------------------------
-- 6. Migrate top-frequency framework values into technique_tags (append-only)
-- ----------------------------------------------------------------------------
-- Maps the 30 most-frequent framework strings (~85% of occurrences) to
-- canonical technique slugs. Anything not in this list stays in `frameworks`
-- and gets cleaned in a follow-up. Append into technique_tags without
-- overwriting existing tags.

WITH mapping(label, slug) AS (
  VALUES
    ('Jobs To Be Done', 'jtbd'),
    ('jobs_to_be_done', 'jtbd'),
    ('Jobs-to-be-Done', 'jtbd'),
    ('Jobs to be Done', 'jtbd'),
    ('Jobs to Be Done', 'jtbd'),
    ('north_star_metric', 'north-star-cascade'),
    ('North Star Metric', 'north-star-cascade'),
    ('North Star Framework', 'north-star-cascade'),
    ('Metric Decomposition', 'metric-decomposition'),
    ('Opportunity Solution Tree', 'opportunity-solution-tree'),
    ('Funnel Analysis', 'funnel-analysis'),
    ('Trust Calibration', 'trust-calibration'),
    ('Porter''s Five Forces', 'porters-five-forces'),
    ('okrs', 'okrs'),
    ('Build-Buy-Partner', 'build-buy-partner'),
    ('Build vs. Buy vs. Partner', 'build-buy-partner'),
    ('Product-Market Fit', 'product-market-fit'),
    ('Freemium Design', 'freemium-design'),
    ('Competitive Moats', 'competitive-moats'),
    ('go_to_market', 'go-to-market'),
    ('stakeholder_mapping', 'stakeholder-mapping'),
    ('5 Whys', 'five-whys'),
    ('five_whys', 'five-whys'),
    ('impact_effort', 'impact-effort'),
    ('User Story Mapping', 'user-story-mapping'),
    ('opportunity_sizing', 'opportunity-sizing'),
    ('platform_theory', 'platform-theory'),
    ('constraint_based_design', 'constraint-based-design'),
    ('Root Cause Analysis', 'root-cause-analysis'),
    ('Value Chain Analysis', 'value-chain-analysis'),
    ('systems_thinking', 'systems-thinking'),
    ('AARRR', 'aarrr'),
    ('growth_loops', 'growth-loops')
)
INSERT INTO techniques (slug, label, discipline, applies_to_types)
SELECT DISTINCT slug, slug, 'product_sense', '{}'::TEXT[]
FROM mapping m
WHERE NOT EXISTS (SELECT 1 FROM techniques t WHERE t.slug = m.slug);

-- Set a nicer label for the newly-inserted slugs (initcap of the slug).
UPDATE techniques
SET label = initcap(replace(slug, '-', ' '))
WHERE label = slug AND slug IN (SELECT DISTINCT slug FROM (
  VALUES ('jtbd'),('north-star-cascade'),('metric-decomposition'),('opportunity-solution-tree'),
    ('funnel-analysis'),('trust-calibration'),('porters-five-forces'),('okrs'),
    ('build-buy-partner'),('product-market-fit'),('freemium-design'),('competitive-moats'),
    ('go-to-market'),('stakeholder-mapping'),('five-whys'),('impact-effort'),
    ('user-story-mapping'),('opportunity-sizing'),('platform-theory'),
    ('constraint-based-design'),('root-cause-analysis'),('value-chain-analysis'),
    ('systems-thinking'),('aarrr'),('growth-loops')
) AS v(slug));

-- Append mapped frameworks into technique_tags (de-duped via array_agg(DISTINCT)).
WITH mapping(label, slug) AS (
  VALUES
    ('Jobs To Be Done', 'jtbd'), ('jobs_to_be_done', 'jtbd'), ('Jobs-to-be-Done', 'jtbd'),
    ('Jobs to be Done', 'jtbd'), ('Jobs to Be Done', 'jtbd'),
    ('north_star_metric', 'north-star-cascade'), ('North Star Metric', 'north-star-cascade'),
    ('North Star Framework', 'north-star-cascade'),
    ('Metric Decomposition', 'metric-decomposition'),
    ('Opportunity Solution Tree', 'opportunity-solution-tree'),
    ('Funnel Analysis', 'funnel-analysis'), ('Trust Calibration', 'trust-calibration'),
    ('Porter''s Five Forces', 'porters-five-forces'),
    ('okrs', 'okrs'), ('Build-Buy-Partner', 'build-buy-partner'),
    ('Build vs. Buy vs. Partner', 'build-buy-partner'),
    ('Product-Market Fit', 'product-market-fit'), ('Freemium Design', 'freemium-design'),
    ('Competitive Moats', 'competitive-moats'), ('go_to_market', 'go-to-market'),
    ('stakeholder_mapping', 'stakeholder-mapping'),
    ('5 Whys', 'five-whys'), ('five_whys', 'five-whys'),
    ('impact_effort', 'impact-effort'), ('User Story Mapping', 'user-story-mapping'),
    ('opportunity_sizing', 'opportunity-sizing'), ('platform_theory', 'platform-theory'),
    ('constraint_based_design', 'constraint-based-design'),
    ('Root Cause Analysis', 'root-cause-analysis'),
    ('Value Chain Analysis', 'value-chain-analysis'),
    ('systems_thinking', 'systems-thinking'), ('AARRR', 'aarrr'),
    ('growth_loops', 'growth-loops')
), per_challenge AS (
  SELECT c.id, array_agg(DISTINCT m.slug) AS new_slugs
  FROM challenges c
  CROSS JOIN LATERAL unnest(coalesce(c.frameworks, '{}'::TEXT[])) AS fw
  JOIN mapping m ON m.label = fw
  WHERE c.frameworks IS NOT NULL AND cardinality(c.frameworks) > 0
  GROUP BY c.id
)
UPDATE challenges c
SET technique_tags = (
  SELECT array_agg(DISTINCT s) FROM unnest(coalesce(c.technique_tags, '{}'::TEXT[]) || pc.new_slugs) s
)
FROM per_challenge pc
WHERE c.id = pc.id;

-- ----------------------------------------------------------------------------
-- 7. topics / techniques: maintain challenge_count and seed applies_to_types
-- ----------------------------------------------------------------------------

-- One-shot seed of challenge_count + applies_to_types from current data.
UPDATE topics t
SET
  challenge_count = (
    SELECT COUNT(*)::INT FROM challenges c
    WHERE c.is_published = true AND c.topic_tags @> ARRAY[t.slug]
  ),
  applies_to_types = COALESCE((
    SELECT array_agg(DISTINCT c.challenge_type) FROM challenges c
    WHERE c.is_published = true AND c.topic_tags @> ARRAY[t.slug] AND c.challenge_type IS NOT NULL
  ), '{}'::TEXT[]);

UPDATE techniques tq
SET
  challenge_count = (
    SELECT COUNT(*)::INT FROM challenges c
    WHERE c.is_published = true AND c.technique_tags @> ARRAY[tq.slug]
  ),
  applies_to_types = COALESCE((
    SELECT array_agg(DISTINCT c.challenge_type) FROM challenges c
    WHERE c.is_published = true AND c.technique_tags @> ARRAY[tq.slug] AND c.challenge_type IS NOT NULL
  ), '{}'::TEXT[]);

-- Ensure topics seeded by this migration are visible to the public select policy.
-- Only publish topics that ALREADY have a published challenge attached — avoids
-- accidentally publishing manually-unpublished topic rows.
UPDATE topics SET is_published = true
WHERE (is_published IS NULL OR is_published = false)
  AND challenge_count > 0;

-- Trigger to keep topics.challenge_count / techniques.challenge_count in sync.
-- Recomputes affected rows on each challenge row INSERT/UPDATE/DELETE.
CREATE OR REPLACE FUNCTION trg_recompute_topic_counts() RETURNS TRIGGER AS $$
DECLARE
  affected_topics TEXT[];
  affected_techs  TEXT[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    affected_topics := COALESCE(NEW.topic_tags, '{}'::TEXT[]);
    affected_techs  := COALESCE(NEW.technique_tags, '{}'::TEXT[]);
  ELSIF TG_OP = 'DELETE' THEN
    affected_topics := COALESCE(OLD.topic_tags, '{}'::TEXT[]);
    affected_techs  := COALESCE(OLD.technique_tags, '{}'::TEXT[]);
  ELSE -- UPDATE
    affected_topics := COALESCE(NEW.topic_tags, '{}'::TEXT[]) || COALESCE(OLD.topic_tags, '{}'::TEXT[]);
    affected_techs  := COALESCE(NEW.technique_tags, '{}'::TEXT[]) || COALESCE(OLD.technique_tags, '{}'::TEXT[]);
  END IF;

  IF cardinality(affected_topics) > 0 THEN
    UPDATE topics t SET challenge_count = (
      SELECT COUNT(*)::INT FROM challenges c WHERE c.is_published = true AND c.topic_tags @> ARRAY[t.slug]
    ) WHERE t.slug = ANY(affected_topics);
  END IF;

  IF cardinality(affected_techs) > 0 THEN
    UPDATE techniques tq SET challenge_count = (
      SELECT COUNT(*)::INT FROM challenges c WHERE c.is_published = true AND c.technique_tags @> ARRAY[tq.slug]
    ) WHERE tq.slug = ANY(affected_techs);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS challenges_topic_counts ON challenges;
CREATE TRIGGER challenges_topic_counts
  AFTER INSERT OR UPDATE OR DELETE ON challenges
  FOR EACH ROW EXECUTE FUNCTION trg_recompute_topic_counts();

-- ----------------------------------------------------------------------------
-- 8. Warning trigger for missing tags on published challenges (RAISE NOTICE)
-- ----------------------------------------------------------------------------
-- R2 logs a notice; R3 will promote this to RAISE EXCEPTION once the admin
-- review workflow has confirmed tag coverage.

CREATE OR REPLACE FUNCTION trg_warn_missing_tags() RETURNS TRIGGER AS $$
BEGIN
  -- Skip when nothing relevant changed; avoids notice noise on unrelated updates.
  IF TG_OP = 'UPDATE'
     AND NEW.is_published    IS NOT DISTINCT FROM OLD.is_published
     AND NEW.topic_tags      IS NOT DISTINCT FROM OLD.topic_tags
     AND NEW.technique_tags  IS NOT DISTINCT FROM OLD.technique_tags THEN
    RETURN NEW;
  END IF;

  IF NEW.is_published = true THEN
    IF NEW.topic_tags IS NULL OR cardinality(NEW.topic_tags) = 0 THEN
      RAISE NOTICE 'challenge %: published with empty topic_tags', NEW.id;
    END IF;
    IF NEW.technique_tags IS NULL OR cardinality(NEW.technique_tags) = 0 THEN
      RAISE NOTICE 'challenge %: published with empty technique_tags', NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS challenges_warn_missing_tags ON challenges;
CREATE TRIGGER challenges_warn_missing_tags
  BEFORE INSERT OR UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION trg_warn_missing_tags();

-- ----------------------------------------------------------------------------
-- 9. study_plan_chapters: metadata for tag-aware section headers
-- ----------------------------------------------------------------------------

ALTER TABLE study_plan_chapters
  ADD COLUMN IF NOT EXISTS topic_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS move_tags  TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulty TEXT;

CREATE INDEX IF NOT EXISTS idx_study_plan_chapters_topic_tags ON study_plan_chapters USING GIN (topic_tags);
CREATE INDEX IF NOT EXISTS idx_study_plan_chapters_move_tags  ON study_plan_chapters USING GIN (move_tags);

-- ----------------------------------------------------------------------------
-- 10. Unpublish the 4 empty move-tagged study plan shells
-- ----------------------------------------------------------------------------
-- These shells never received chapters. Drilling on a single FLOW move now
-- happens via the Practice filter row (?move=frame), not a separate plan.

UPDATE study_plans
SET is_published = false
WHERE slug IN ('frame-like-a-pm','the-list-move','optimize-under-pressure','win-the-room');

COMMIT;

-- ============================================================================
-- Post-migration verification (run manually after applying):
--   SELECT difficulty, COUNT(*) FROM challenges GROUP BY 1;
--     -> expect easy=132, medium=313, hard=275 (272 advanced + 3 staff_plus)
--   SELECT difficulty, COUNT(*) FROM learn_modules GROUP BY 1;
--     -> expect easy=12, medium=29, hard=10 (8 beginner + 3 foundation + 1 entry-point = 12 easy;
--        20 intermediate + 9 new-era = 29 medium; 10 advanced = 10 hard)
--   SELECT slug, challenge_count FROM topics ORDER BY challenge_count DESC LIMIT 10;
--     -> non-zero counts for the populated topics
--   SELECT COUNT(*) FROM challenges WHERE cardinality(industry_tags) > 0;
--     -> 128 or so (rows that had industry or sub_vertical)
--   SELECT slug FROM study_plans WHERE is_published = false ORDER BY slug;
--     -> includes the 4 move-shells
-- ============================================================================
