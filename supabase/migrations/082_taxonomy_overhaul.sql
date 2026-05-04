-- ============================================================
-- Migration 082: Taxonomy Overhaul — Schema Changes
--
-- Part 1 of 2 (see 083 for seed data).
--
-- Changes:
-- 1. Add taxonomy columns to challenges table
-- 2. Repair orphaned FK tables (challenge_topics, challenge_companies,
--    study_plan_items) whose challenge_id pointed to the archived
--    challenge_prompts(id) UUIDs, not challenges(id) TEXT.
-- 3. Create the techniques table (controlled vocabulary for techniques)
-- 4. Extend topics table with discipline + parent_slug (hierarchical)
-- 5. Extend company_profiles with aliases + interview_loop_disciplines
-- ============================================================


-- ============================================================
-- STEP 1: Add taxonomy columns to challenges
-- ============================================================
-- topic_tags / technique_tags: curated from controlled vocab (see 083 seed)
-- *_suggested: AI-generated candidates awaiting admin review
-- is_real_interview: true = confirmed sourced from a real interview loop
-- source_url: link to original source (blog post, Glassdoor, etc.)
-- ============================================================

BEGIN;

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS topic_tags               TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS technique_tags           TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topic_tags_suggested     TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS technique_tags_suggested TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_real_interview        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_url               TEXT;

-- GIN indexes for efficient ANY/&& array lookups on tag columns
CREATE INDEX IF NOT EXISTS idx_challenges_topic_tags
  ON challenges USING gin(topic_tags);

CREATE INDEX IF NOT EXISTS idx_challenges_technique_tags
  ON challenges USING gin(technique_tags);

CREATE INDEX IF NOT EXISTS idx_challenges_is_real_interview
  ON challenges(is_real_interview) WHERE is_real_interview = true;

COMMIT;


-- ============================================================
-- STEP 2: Repair challenge_topics — orphaned FK to archived table
-- ============================================================
-- challenge_topics.challenge_id was originally UUID referencing
-- challenge_prompts(id). Migration 037 archived challenge_prompts
-- and all real challenges now live in challenges(id) (TEXT).
-- Any rows with UUIDs not in challenges are dead legacy rows.
-- Strategy:
--   a) Drop old FK constraint
--   b) Cast column to TEXT (UUID → TEXT is a safe cast)
--   c) Delete rows whose challenge_id no longer exists in challenges
--   d) Add new FK to challenges(id) ON DELETE CASCADE
-- ============================================================

BEGIN;

-- a) Drop old FK to archived challenge_prompts
ALTER TABLE challenge_topics
  DROP CONSTRAINT IF EXISTS challenge_topics_challenge_id_fkey;

-- b) Change column type from UUID to TEXT (UUIDs cast cleanly)
ALTER TABLE challenge_topics
  ALTER COLUMN challenge_id TYPE TEXT USING challenge_id::TEXT;

-- c) Delete orphaned rows (legacy UUID challenge_ids not in challenges)
DELETE FROM challenge_topics
  WHERE challenge_id NOT IN (SELECT id FROM challenges);

-- d) Add new FK to challenges(id)
ALTER TABLE challenge_topics
  ADD CONSTRAINT challenge_topics_challenge_id_fkey
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

COMMIT;


-- ============================================================
-- STEP 3: Repair challenge_companies — orphaned FK to archived table
-- ============================================================
-- Same pattern as challenge_topics above.
-- ============================================================

BEGIN;

-- a) Drop old FK to archived challenge_prompts
ALTER TABLE challenge_companies
  DROP CONSTRAINT IF EXISTS challenge_companies_challenge_id_fkey;

-- b) Change column type from UUID to TEXT
ALTER TABLE challenge_companies
  ALTER COLUMN challenge_id TYPE TEXT USING challenge_id::TEXT;

-- c) Delete orphaned rows
DELETE FROM challenge_companies
  WHERE challenge_id NOT IN (SELECT id FROM challenges);

-- d) Add new FK to challenges(id)
ALTER TABLE challenge_companies
  ADD CONSTRAINT challenge_companies_challenge_id_fkey
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

COMMIT;


-- ============================================================
-- STEP 4: Repair study_plan_items — orphaned FK to archived table
-- ============================================================
-- study_plan_items.challenge_id was UUID referencing challenge_prompts(id).
-- Same repair pattern. concept_id FK is untouched (concepts still exists).
-- ============================================================

BEGIN;

-- a) Drop old FK to archived challenge_prompts
ALTER TABLE study_plan_items
  DROP CONSTRAINT IF EXISTS study_plan_items_challenge_id_fkey;

-- b) Change column type from UUID to TEXT
ALTER TABLE study_plan_items
  ALTER COLUMN challenge_id TYPE TEXT USING challenge_id::TEXT;

-- c) Delete orphaned rows (where challenge_id is set but not in challenges)
DELETE FROM study_plan_items
  WHERE challenge_id IS NOT NULL
    AND challenge_id NOT IN (SELECT id FROM challenges);

-- d) Add new FK to challenges(id) (nullable — items may reference concepts)
ALTER TABLE study_plan_items
  ADD CONSTRAINT study_plan_items_challenge_id_fkey
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

COMMIT;


-- ============================================================
-- STEP 5: Create techniques table (controlled vocabulary)
-- ============================================================
-- Techniques are reusable problem-solving patterns that cut across
-- topics. A challenge can use multiple techniques.
--
-- discipline: one of the 6 canonical disciplines (underscored):
--   coding | system_design | data_modeling | sql | product_sense | ai_engineering
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS techniques (
  id          SERIAL PRIMARY KEY,
  slug        TEXT        UNIQUE NOT NULL,
  label       TEXT        NOT NULL,
  discipline  TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_techniques_discipline
  ON techniques(discipline);

-- RLS — same pattern as topics
ALTER TABLE techniques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view techniques"
  ON techniques FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage techniques"
  ON techniques FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

COMMIT;


-- ============================================================
-- STEP 6: Extend topics — add discipline + parent_slug
-- ============================================================
-- discipline: which of the 6 disciplines this topic belongs to
-- parent_slug: enables 2-level hierarchy
-- Both columns are nullable: existing rows won't break.
-- ============================================================

BEGIN;

ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS discipline   TEXT,
  ADD COLUMN IF NOT EXISTS parent_slug  TEXT;

CREATE INDEX IF NOT EXISTS idx_topics_discipline
  ON topics(discipline) WHERE discipline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_topics_parent_slug
  ON topics(parent_slug) WHERE parent_slug IS NOT NULL;

COMMIT;


-- ============================================================
-- STEP 7: Extend company_profiles — add aliases + interview_loop_disciplines
-- ============================================================
-- aliases: common alternate names used for fuzzy matching in tag editor
-- interview_loop_disciplines: which disciplines this company tests
--   drives "Prepare for X" filter on the explore page
-- ============================================================

BEGIN;

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS aliases                    TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interview_loop_disciplines TEXT[]  DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_company_profiles_interview_loop_disciplines
  ON company_profiles USING gin(interview_loop_disciplines);

COMMIT;
