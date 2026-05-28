-- ============================================================================
-- Migration C: R3.E.1 — Drop legacy columns
-- ============================================================================
-- Codex-approved sequencing per plan R3.E. Pre-conditions:
-- - All read paths swapped to canonical columns in R3.A (industry_tags / topic_tags / technique_tags).
-- - Admin form rewritten to chip multi-select in R3.A.bis.
-- - scripts/check-pre-contract.ts passes 12/12 against the current DB.
-- - This migration ONLY drops the four legacy columns; trigger flip to EXCEPTION is in R3.E.2 (separate migration, post-Phase 3).
--
-- DROP COLUMN takes an ACCESS EXCLUSIVE lock on challenges. Apply during a
-- low-traffic window. All drops share one transaction — any failure rolls
-- everything back together. Separate statements (vs. one comma-list) keep
-- the failing column identifiable in error logs.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Drop the 4 legacy columns on challenges
-- ----------------------------------------------------------------------------

ALTER TABLE challenges DROP COLUMN IF EXISTS tags;
ALTER TABLE challenges DROP COLUMN IF EXISTS industry;
ALTER TABLE challenges DROP COLUMN IF EXISTS sub_vertical;
ALTER TABLE challenges DROP COLUMN IF EXISTS frameworks;

-- ----------------------------------------------------------------------------
-- 2. Tighten the relaxed CHECK constraints on autopsy_decisions and weekly_rooms
--    back to canonical-only. R2 widened them to dual-accept; now that the
--    challenges table is canonical-only, these can follow.
-- ----------------------------------------------------------------------------

-- Backfill autopsy_decisions: rewrite any legacy difficulty values into the
-- canonical bucket (tier-shift mapping consistent with R2's challenges backfill).
-- Then assert no legacy rows remain before tightening the CHECK.
UPDATE autopsy_decisions SET difficulty = CASE difficulty
    WHEN 'warmup'     THEN 'easy'
    WHEN 'standard'   THEN 'medium'
    WHEN 'advanced'   THEN 'hard'
    WHEN 'staff_plus' THEN 'hard'
    WHEN 'beginner'   THEN 'easy'
    WHEN 'intermediate' THEN 'medium'
    ELSE difficulty
END
WHERE difficulty NOT IN ('easy','medium','hard');

DO $$
DECLARE
  bad_count INT;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM autopsy_decisions WHERE difficulty NOT IN ('easy','medium','hard');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'autopsy_decisions has % rows with non-canonical difficulty after backfill', bad_count;
  END IF;
END$$;

ALTER TABLE autopsy_decisions DROP CONSTRAINT IF EXISTS autopsy_decisions_difficulty_check;
ALTER TABLE autopsy_decisions ADD CONSTRAINT autopsy_decisions_difficulty_check
  CHECK (difficulty IN ('easy','medium','hard'));

-- Same pattern for weekly_rooms.
UPDATE weekly_rooms SET difficulty = CASE difficulty
    WHEN 'warmup'     THEN 'easy'
    WHEN 'standard'   THEN 'medium'
    WHEN 'advanced'   THEN 'hard'
    WHEN 'staff_plus' THEN 'hard'
    WHEN 'beginner'   THEN 'easy'
    WHEN 'intermediate' THEN 'medium'
    ELSE difficulty
END
WHERE difficulty NOT IN ('easy','medium','hard');

DO $$
DECLARE
  bad_count INT;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM weekly_rooms WHERE difficulty NOT IN ('easy','medium','hard');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'weekly_rooms has % rows with non-canonical difficulty after backfill', bad_count;
  END IF;
END$$;

ALTER TABLE weekly_rooms DROP CONSTRAINT IF EXISTS weekly_rooms_difficulty_check;
ALTER TABLE weekly_rooms ADD CONSTRAINT weekly_rooms_difficulty_check
  CHECK (difficulty IN ('easy','medium','hard'));

-- ----------------------------------------------------------------------------
-- 3. Sanity assertion — learn_modules.difficulty should have only canonical values
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  bad_count INT;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM learn_modules WHERE difficulty NOT IN ('easy','medium','hard');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'learn_modules.difficulty has % rows not in (easy,medium,hard) — R2 migration was incomplete', bad_count;
  END IF;
END$$;

COMMIT;

-- ============================================================================
-- Post-migration verification:
--   -- Verify dropped columns are gone
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'challenges'
--       AND column_name IN ('tags','industry','sub_vertical','frameworks');
--   -- Expect: 0 rows
--
--   -- Spot-check: SELECT 1 FROM challenges WHERE is_published = true LIMIT 1;
--   -- Should still work (no RLS regression).
-- ============================================================================
