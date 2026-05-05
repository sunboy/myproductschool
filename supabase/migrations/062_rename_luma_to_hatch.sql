-- Migration 062: Rename Luma → Hatch (DB schema side of the rebrand)
--
-- Context: The AI coach persona has been renamed from "Luma" to "Hatch".
-- Code files (src/lib/hatch/*, src/lib/hatch-context.ts) already reference
-- hatch_context; this migration renames the underlying DB objects to match.
--
-- Scope:
--   1. luma_context table → hatch_context (plus its index + RLS policies)
--   2. user_study_plans.luma_rationale column → hatch_rationale
--   3. simulation_turns role CHECK: allow 'hatch' alongside 'luma', migrate data, tighten
--   4. live_interview_turns role CHECK: same treatment
--   5. Persona display_name values in challenge_discussions / discussion_replies
--
-- Note on `luma_context`:
--   The live table is what migration 028 promoted from `luma_context_v2`. Its
--   index is `idx_luma_context_v2_user` and its policies are named
--   `luma_context_v2_read` / `luma_context_v2_service` (all carry the v2
--   suffix despite the table itself no longer having it — see 028). The
--   original 019 `luma_context_user_idx` and `luma_context_unique` live on
--   `_archived_luma_context_legacy` and are not touched here.
--
-- Idempotency: every statement uses IF EXISTS guards or data-driven WHERE
-- clauses so a partial re-run is safe.

-- ── 1. Table rename: luma_context → hatch_context ─────────────

ALTER TABLE IF EXISTS luma_context RENAME TO hatch_context;

-- ── 2. Index rename ───────────────────────────────────────────

ALTER INDEX IF EXISTS idx_luma_context_v2_user RENAME TO idx_hatch_context_user;

-- ── 3. RLS policy renames (policies move with the table; rename in place) ──

DO $$ BEGIN
  EXECUTE 'ALTER POLICY "luma_context_v2_read" ON hatch_context RENAME TO "hatch_context_read"';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  EXECUTE 'ALTER POLICY "luma_context_v2_service" ON hatch_context RENAME TO "hatch_context_service"';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- ── 4. user_study_plans.luma_rationale → hatch_rationale ──────

DO $$ BEGIN
  ALTER TABLE user_study_plans RENAME COLUMN luma_rationale TO hatch_rationale;
EXCEPTION WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

-- ── 5. simulation_turns: allow 'hatch', migrate data, lock to 'hatch' only ──
--
-- Done in three steps so the UPDATE never violates the CHECK:
--   a. Drop the 'user'|'luma' constraint
--   b. Backfill existing rows from 'luma' → 'hatch'
--   c. Re-add constraint as 'user'|'hatch'

ALTER TABLE simulation_turns
  DROP CONSTRAINT IF EXISTS simulation_turns_role_check;

UPDATE simulation_turns SET role = 'hatch' WHERE role = 'luma';

ALTER TABLE simulation_turns
  ADD CONSTRAINT simulation_turns_role_check
  CHECK (role IN ('user', 'hatch'));

-- ── 6. live_interview_turns: same pattern ─────────────────────
--
-- NOTE: the CHECK on this column was added by 035b's CREATE TABLE IF NOT
-- EXISTS — if 033b already ran first, the constraint was NOT created. The
-- IF EXISTS on the DROP handles both scenarios.

ALTER TABLE live_interview_turns
  DROP CONSTRAINT IF EXISTS live_interview_turns_role_check;

UPDATE live_interview_turns SET role = 'hatch' WHERE role = 'luma';

ALTER TABLE live_interview_turns
  ADD CONSTRAINT live_interview_turns_role_check
  CHECK (role IN ('user', 'hatch'));

-- ── 7. Persona display_name values in discussions ─────────────
--
-- `challenge_discussions.display_name` and `discussion_replies.display_name`
-- were added in 018 for bot persona labels like "Luma" or "Luma · Data".
-- Rewrite any substring occurrence.

UPDATE challenge_discussions
  SET display_name = REPLACE(display_name, 'Luma', 'Hatch')
  WHERE display_name LIKE '%Luma%';

UPDATE discussion_replies
  SET display_name = REPLACE(display_name, 'Luma', 'Hatch')
  WHERE display_name LIKE '%Luma%';
