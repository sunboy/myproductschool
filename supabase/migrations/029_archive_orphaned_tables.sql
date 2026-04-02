-- Migration 029: Archive orphaned tables
-- These tables have zero active references in src/ and have been superseded
-- or were never functionally used in the current application.
--
-- Verification (pre-archive):
--   grep -r "feature_flags|dashboard_preferences|plan_challenges|plan_weeks" src/ → 0 results
--   admin_content_queue: SKIPPED — active reference in src/app/(admin)/admin/page.tsx
--
-- Tables that REQUIRE INVESTIGATION (referenced in src/ — NOT archived here):
--   user_streaks       → src/lib/data/analytics.ts references .from('user_streaks')
--   study_plan_items   → src/lib/data/study-plans.ts references .from('study_plan_items') (x2)
--   quick_takes        → src/lib/data/quick-takes.ts references .from('quick_takes') (x2)

-- 1. feature_flags
--    Defined in earlier migrations; zero .from('feature_flags') calls in src/.
ALTER TABLE IF EXISTS feature_flags RENAME TO _archived_feature_flags;

-- 2. dashboard_preferences
--    Defined in migrations 012 and 022; never queried in any page, hook, or component.
ALTER TABLE IF EXISTS dashboard_preferences RENAME TO _archived_dashboard_preferences;

-- 3. plan_challenges
--    Superseded by study_plan_chapters; zero references in src/.
ALTER TABLE IF EXISTS plan_challenges RENAME TO _archived_plan_challenges;

-- 4. plan_weeks
--    Superseded alongside plan_challenges; zero references in src/.
ALTER TABLE IF EXISTS plan_weeks RENAME TO _archived_plan_weeks;
