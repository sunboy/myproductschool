-- supabase/migrations/071_study_plans_loop_tracks.sql
ALTER TABLE study_plans
  ADD COLUMN IF NOT EXISTS track_type TEXT NOT NULL DEFAULT 'study_plan'
    CHECK (track_type IN ('study_plan', 'loop')),
  ADD COLUMN IF NOT EXISTS disciplines TEXT[] NOT NULL DEFAULT '{}';

-- Seed three loop tracks so Explore has content immediately
INSERT INTO study_plans (id, title, slug, description, estimated_hours, is_published, track_type, disciplines, difficulty, challenge_count, order_index)
VALUES
  (gen_random_uuid(), 'Staff Eng Loop', 'staff-eng-loop',
   'System design, product sense, and coding prep for senior engineering roles.',
   12, true, 'loop', ARRAY['system_design','product_sense','coding'], 'advanced', 0, 100),
  (gen_random_uuid(), 'PM Switch Loop', 'pm-switch-loop',
   'Product sense and data modeling for engineers transitioning to product management.',
   8, true, 'loop', ARRAY['product_sense','data_modeling'], 'intermediate', 0, 101),
  (gen_random_uuid(), 'Founding Eng Loop', 'founding-eng-loop',
   'All four disciplines for engineers joining early-stage companies.',
   16, true, 'loop', ARRAY['product_sense','system_design','data_modeling','coding'], 'advanced', 0, 102);
