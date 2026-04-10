-- User enrollments in curated study plans
CREATE TABLE IF NOT EXISTS user_study_plan_enrollments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id        UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_user_plan_enrollment UNIQUE (user_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user
  ON user_study_plan_enrollments(user_id, enrolled_at DESC);

ALTER TABLE user_study_plan_enrollments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users can manage own enrollments"
    ON user_study_plan_enrollments
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
