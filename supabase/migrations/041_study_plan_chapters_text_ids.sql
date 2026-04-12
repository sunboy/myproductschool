-- Change study_plan_chapters.challenge_ids from uuid[] to text[]
-- Real challenge IDs are text (e.g. 'c1-notification-fatigue'), not UUIDs
ALTER TABLE study_plan_chapters
  ALTER COLUMN challenge_ids TYPE text[] USING challenge_ids::text[];
