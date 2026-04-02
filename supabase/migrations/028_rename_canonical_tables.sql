-- Migration 028: Rename canonical v2 tables to clean names; archive legacy tables
--
-- Context: The app has two overlapping challenge systems. We are consolidating to
-- the FLOW-based v2 system as canonical. This migration:
--   - Archives legacy free-text tables by prefixing with _archived_
--   - Renames the v2 tables to their clean canonical names
--
-- Order matters: the legacy challenge_attempts must be archived BEFORE renaming
-- challenge_attempts_v2, to avoid a name collision.
--
-- RLS policy note: In PostgreSQL, RLS policies are stored on the table object
-- (identified by OID), not on the table name. When a table is renamed, all
-- attached policies move with it automatically — no manual policy recreation
-- is required for simple policies. The following policies will continue to
-- apply unchanged after renaming:
--
--   challenge_attempts (formerly challenge_attempts_v2):
--     - "attempts_v2_own"   — users manage own rows (auth.uid() = user_id)
--     - "attempts_v2_admin" — admins can SELECT all rows
--
--   luma_context (formerly luma_context_v2):
--     - "luma_context_v2_read"    — users can SELECT own rows
--     - "luma_context_v2_service" — service role has full access
--
--   _archived_luma_feedback (formerly luma_feedback):
--     - "Users can view own feedback"    — SELECT via challenge_attempts join
--     - "Service role can insert feedback" — INSERT for service role
--
--   _archived_challenge_attempts_legacy (formerly challenge_attempts):
--     - "Users can manage own attempts" — ALL for own user_id
--     - "Admins can view all attempts"  — SELECT for admin role
--
-- IMPORTANT EXCEPTION: Policies whose bodies contain subqueries that reference
-- other tables by name do NOT follow those tables' renames. The policy body is
-- stored as TEXT in pg_policy.polqual; it is not recompiled when the referenced
-- table is renamed. Such policies must be explicitly dropped and recreated.
--
-- Affected policy in this migration:
--   step_attempts."step_attempts_own" — references challenge_attempts_v2 in
--   its USING clause. After renaming challenge_attempts_v2 → challenge_attempts,
--   this policy would throw "relation challenge_attempts_v2 does not exist" at
--   runtime. It is explicitly recreated at the end of this migration.
--
-- ── Pre-step: Drop legacy view that references the old free-text table ────────
-- user_productiq was built on the legacy challenge_attempts table (free-text
-- system) and uses a `score` column that does not exist on the v2 FLOW table.
-- After renaming, challenge_attempts will be the v2 table; this view would
-- error at query time. Drop it now, before any renames occur.

DROP VIEW IF EXISTS user_productiq;

-- ── Step 1: Archive legacy challenge_attempts (free-text system) ──────────────
-- Must happen BEFORE renaming challenge_attempts_v2 to avoid collision.

ALTER TABLE IF EXISTS challenge_attempts RENAME TO _archived_challenge_attempts_legacy;

-- ── Step 2: Promote v2 table to canonical name ────────────────────────────────

ALTER TABLE IF EXISTS challenge_attempts_v2 RENAME TO challenge_attempts;

-- ── Step 3: Archive legacy luma_context (superseded by luma_context_v2) ──────

ALTER TABLE IF EXISTS luma_context RENAME TO _archived_luma_context_legacy;

-- ── Step 4: Promote v2 luma context table to canonical name ──────────────────

ALTER TABLE IF EXISTS luma_context_v2 RENAME TO luma_context;

-- ── Step 5: Archive legacy luma_feedback (superseded by challenge_attempts.feedback_json) ──

ALTER TABLE IF EXISTS luma_feedback RENAME TO _archived_luma_feedback;

-- ── Step 6: Recreate step_attempts_own RLS policy ────────────────────────────
-- The original policy (defined in migration 024) contains a subquery that
-- hardcodes the table name challenge_attempts_v2. That name no longer exists
-- after Step 2 above. Drop and recreate the policy pointing at the new name.

DROP POLICY IF EXISTS "step_attempts_own" ON step_attempts;
CREATE POLICY "step_attempts_own" ON step_attempts
  FOR ALL USING (attempt_id IN (SELECT id FROM challenge_attempts WHERE user_id = auth.uid()));
