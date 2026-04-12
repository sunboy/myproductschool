-- Fix study_plan_items.challenge_id FK to point to challenges (not archived table)
-- The original FK referenced challenge_prompts which was renamed to _archived_challenge_prompts

ALTER TABLE study_plan_items
  DROP CONSTRAINT IF EXISTS study_plan_items_challenge_id_fkey;

ALTER TABLE study_plan_items
  ADD CONSTRAINT study_plan_items_challenge_id_fkey
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE SET NULL;
