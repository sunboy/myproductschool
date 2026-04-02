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
-- is required. The following policies will continue to apply unchanged:
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
