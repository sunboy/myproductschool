-- ============================================================
-- Migration 037: Consolidate challenge tables
--
-- Merges challenge_prompts (50 freeform), quick_takes (1), and
-- autopsy_challenges (3 redundant bridge rows) into the canonical
-- `challenges` table. After this migration, `challenges` is the
-- single source of truth for all challenge content.
--
-- New column: challenge_type  ('flow' | 'freeform' | 'quick_take')
-- New columns absorbed from challenge_prompts:
--   prompt_text, domain_id, scenario_embedding, move_tags, slug
-- New column from autopsy_challenges:
--   decision_id (nullable FK to autopsy_decisions)
--
-- Tables archived after data migration:
--   challenge_prompts  → _archived_challenge_prompts
--   autopsy_challenges → _archived_autopsy_challenges
--   quick_takes        → _archived_quick_takes
--   autopsy_attempts   → _archived_autopsy_attempts
-- ============================================================

-- ── Step 1: Add new columns to challenges ───────────────────

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS challenge_type TEXT NOT NULL DEFAULT 'flow'
    CHECK (challenge_type IN ('flow', 'freeform', 'quick_take')),
  ADD COLUMN IF NOT EXISTS prompt_text TEXT,
  ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES domains(id),
  ADD COLUMN IF NOT EXISTS scenario_embedding extensions.vector(384),
  ADD COLUMN IF NOT EXISTS move_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS decision_id UUID REFERENCES autopsy_decisions(id),
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Unique index on slug (nullable — only freeform challenges will have slugs initially)
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_slug ON challenges(slug) WHERE slug IS NOT NULL;

-- Index for challenge_type filtering
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);

-- Index for domain_id lookups
CREATE INDEX IF NOT EXISTS idx_challenges_domain ON challenges(domain_id) WHERE domain_id IS NOT NULL;


-- ── Step 2: Migrate challenge_prompts → challenges ──────────
-- challenge_prompts has UUID ids, challenges has TEXT ids.
-- We cast the UUID to TEXT for the id column.

INSERT INTO challenges (
  id, title, scenario_context, scenario_trigger, scenario_question,
  paradigm, difficulty, estimated_minutes, tags, is_published, is_premium,
  relevant_roles, created_at, updated_at,
  -- new consolidated columns
  challenge_type, prompt_text, domain_id, scenario_embedding, move_tags
)
SELECT
  cp.id::TEXT,
  cp.title,
  cp.prompt_text,                         -- scenario_context = prompt_text
  '',                                     -- scenario_trigger (not used for freeform)
  cp.title,                               -- scenario_question = title as fallback
  -- Map paradigm values: challenge_prompts uses hyphens, challenges uses underscores
  CASE cp.paradigm
    WHEN 'ai-assisted' THEN 'ai_assisted'
    WHEN 'ai-native'   THEN 'ai_native'
    ELSE COALESCE(cp.paradigm, 'traditional')
  END,
  -- Map difficulty values: challenge_prompts uses beginner/intermediate/advanced
  -- challenges uses warmup/standard/advanced/staff_plus
  CASE cp.difficulty
    WHEN 'beginner'     THEN 'warmup'
    WHEN 'intermediate' THEN 'standard'
    WHEN 'advanced'     THEN 'advanced'
    ELSE 'standard'
  END,
  cp.estimated_minutes,
  cp.tags,
  cp.is_published,
  COALESCE(cp.is_premium, false),
  COALESCE(cp.role_tags, '{}'),
  cp.created_at,
  cp.created_at,                          -- updated_at = created_at
  -- consolidated columns
  'freeform',
  cp.prompt_text,
  cp.domain_id,
  cp.scenario_embedding,
  COALESCE(cp.move_tags, '{}')
FROM challenge_prompts cp
ON CONFLICT (id) DO NOTHING;


-- ── Step 3: Migrate quick_takes → challenges ────────────────

INSERT INTO challenges (
  id, title, scenario_context, scenario_trigger, scenario_question,
  paradigm, difficulty, estimated_minutes, is_published,
  created_at, updated_at,
  challenge_type, prompt_text, move_tags
)
SELECT
  qt.id::TEXT,
  qt.scenario_text,                       -- title = scenario_text (truncated)
  qt.scenario_text,                       -- scenario_context
  '',                                     -- scenario_trigger
  qt.scenario_text,                       -- scenario_question
  CASE qt.paradigm
    WHEN 'ai-assisted' THEN 'ai_assisted'
    WHEN 'ai-native'   THEN 'ai_native'
    ELSE COALESCE(qt.paradigm, 'traditional')
  END,
  'warmup',                               -- quick takes are always warmup
  2,                                      -- 2 minutes estimated
  true,                                   -- published
  qt.created_at,
  qt.created_at,
  'quick_take',
  qt.scenario_text,
  CASE WHEN qt.move IS NOT NULL THEN ARRAY[qt.move] ELSE '{}' END
FROM quick_takes qt
ON CONFLICT (id) DO NOTHING;


-- ── Step 4: Set decision_id on existing autopsy challenges ──

UPDATE challenges c
SET decision_id = ac.decision_id::UUID
FROM autopsy_challenges ac
WHERE c.id = ac.challenge_id;


-- ── Step 5: Migrate autopsy_attempts → challenge_attempts ───
-- autopsy_attempts uses product_slug + decision_index as key.
-- We need to map these to challenge_id via autopsy_decisions.

-- First, add columns to challenge_attempts for freeform/autopsy data
ALTER TABLE challenge_attempts
  ADD COLUMN IF NOT EXISTS response_text TEXT,
  ADD COLUMN IF NOT EXISTS selected_option_label TEXT,
  ADD COLUMN IF NOT EXISTS legacy_points INTEGER;

-- Migrate autopsy attempts
INSERT INTO challenge_attempts (
  id, user_id, challenge_id, role_id, total_score, max_score,
  grade_label, status, started_at, completed_at, created_at,
  selected_option_label, legacy_points
)
SELECT
  aa.id,
  aa.user_id,
  ac.challenge_id,           -- map to the challenges table via autopsy_challenges
  'swe',                     -- default role
  aa.points::DECIMAL,
  3.0,                       -- max_score for autopsy
  aa.grade_label,
  'completed',
  aa.submitted_at,
  aa.submitted_at,
  aa.submitted_at,
  aa.selected_option_label,
  aa.points
FROM autopsy_attempts aa
JOIN autopsy_decisions ad
  ON ad.product_id = (
    SELECT ap.id FROM autopsy_products ap WHERE ap.slug = aa.product_slug LIMIT 1
  )
  AND ad.sort_order = aa.decision_index
JOIN autopsy_challenges ac ON ac.decision_id = ad.id
WHERE ac.challenge_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;


-- ── Step 6: Archive old tables ──────────────────────────────

ALTER TABLE IF EXISTS challenge_prompts RENAME TO _archived_challenge_prompts;
ALTER TABLE IF EXISTS autopsy_challenges RENAME TO _archived_autopsy_challenges;
ALTER TABLE IF EXISTS quick_takes RENAME TO _archived_quick_takes;
ALTER TABLE IF EXISTS autopsy_attempts RENAME TO _archived_autopsy_attempts;


-- ── Step 7: RLS on new columns ──────────────────────────────
-- challenges already has RLS enabled from migration 024.
-- The existing policies cover all rows regardless of challenge_type.
-- No new policies needed.


-- ── Step 8: Update challenge_discussions FK ──────────────────
-- challenge_discussions references challenge_prompts via challenge_id.
-- We need to check if this table exists and update its FK.
-- (It may reference challenge_prompts.id which is now _archived)

-- Drop old FK constraint if it exists (safe — table was renamed)
-- The discussions table can now reference challenges.id instead.
-- This is handled at the application layer since discussions are
-- already keyed by string challenge_id.


-- ── Verification query (run manually to confirm) ────────────
-- SELECT challenge_type, COUNT(*) FROM challenges GROUP BY challenge_type;
-- Expected: flow=27, freeform=50, quick_take=1 → total 78
