-- Migration 075: Fix challenge_discussions.challenge_id type
--
-- challenge_discussions.challenge_id was created as UUID referencing challenge_prompts(id).
-- After migration 037 consolidated all challenges into a single `challenges` table with TEXT ids
-- (e.g. 'AUTOPSY-NOTION-B5E6FD9C-E6C8-41CA-B154-241F27C911B2'), inserts fail with
-- "invalid input syntax for type uuid" for any non-UUID challenge id.
--
-- Fix: drop the old FK + UUID constraint, cast column to TEXT, no FK (challenges.id is TEXT).

-- Drop old FK constraint if it still exists
ALTER TABLE challenge_discussions
  DROP CONSTRAINT IF EXISTS challenge_discussions_challenge_id_fkey;

-- Cast challenge_id from UUID to TEXT
ALTER TABLE challenge_discussions
  ALTER COLUMN challenge_id TYPE TEXT USING challenge_id::TEXT;
