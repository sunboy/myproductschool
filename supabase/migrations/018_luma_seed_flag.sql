-- Migration: 018_luma_seed_flag.sql
-- Allow system/bot posts in challenge_discussions and discussion_replies.
--
-- The challenge_discussions and discussion_replies tables currently require
-- user_id NOT NULL REFERENCES profiles(id). Bot/AI seed posts have no real
-- auth user, so we:
--   1. Make user_id nullable in both tables
--   2. Add a display_name column for the persona label (e.g. "Luma", "Luma · Data")
--   3. The existing is_expert_pick column already marks Luma coach posts

-- challenge_discussions: make user_id nullable, add display_name
ALTER TABLE challenge_discussions
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE challenge_discussions
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- discussion_replies: make user_id nullable, add display_name
ALTER TABLE discussion_replies
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE discussion_replies
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update RLS insert policy to allow service role seeding (user_id may be null)
-- We keep the existing SELECT policies. Only relax INSERT to allow null user_id
-- when the row is an expert pick (seeded by service role key).
DROP POLICY IF EXISTS "Users insert own" ON challenge_discussions;
CREATE POLICY "Users insert own" ON challenge_discussions
  FOR INSERT
  WITH CHECK (
    -- Real users can post their own
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Service-role seeded bot posts (user_id is null, is_expert_pick marks them)
    (auth.uid() IS NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Users insert own replies" ON discussion_replies;
CREATE POLICY "Users insert own replies" ON discussion_replies
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );
