-- Let a study-plan chapter reference a Learn chapter (mdx lesson) instead of a
-- list of challenges. This is how the "Learn Claude Code" study plan reuses the
-- existing study-plan shell (enrollment, progress, the plan/detail UI) while its
-- chapters render the existing ChapterBody mdx reader rather than challenge cards.
--
-- A chapter is a lesson when learn_chapter_id is set; otherwise it stays a
-- challenge chapter (challenge_ids[]). A future plan can mix both.

ALTER TABLE study_plan_chapters
  ADD COLUMN IF NOT EXISTS learn_chapter_id uuid REFERENCES learn_chapters(id) ON DELETE SET NULL;

-- Make challenge_ids nullable-friendly: lesson chapters carry no challenges.
ALTER TABLE study_plan_chapters
  ALTER COLUMN challenge_ids DROP NOT NULL;
