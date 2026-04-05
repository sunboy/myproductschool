-- ============================================================
-- HackProduct v2 — Mental Models Integration
-- Migration: 026_mental_models_v2.sql
-- Adds: framework_hint, competency_signal, mental_models_breakdown,
--        precomputed_competency_signal, grading_prompt_cache
-- Idempotent: safe to re-run
-- ============================================================

-- ── flow_options: framework_hint for mental model callout ────
ALTER TABLE flow_options ADD COLUMN IF NOT EXISTS framework_hint TEXT;

-- ── flow_options: pre-computed competency signal for MCQ ─────
ALTER TABLE flow_options ADD COLUMN IF NOT EXISTS precomputed_competency_signal JSONB;

-- ── step_attempts: competency signal from grading ────────────
ALTER TABLE step_attempts ADD COLUMN IF NOT EXISTS competency_signal JSONB;

-- ── challenge_attempts_v2: post-challenge mental models map ──
ALTER TABLE challenge_attempts_v2 ADD COLUMN IF NOT EXISTS mental_models_breakdown JSONB;

-- ── Index for failure pattern trend queries ──────────────────
CREATE INDEX IF NOT EXISTS idx_user_failure_patterns_trend
  ON user_failure_patterns(user_id, pattern_id);

-- ── Grading prompt cache (pre-computed per question) ─────────
CREATE TABLE IF NOT EXISTS grading_prompt_cache (
  challenge_id TEXT NOT NULL,
  step TEXT NOT NULL CHECK (step IN ('frame','list','optimize','win')),
  question_sequence INTEGER NOT NULL,
  prompt_prefix TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (challenge_id, step, question_sequence)
);

-- ── RLS for grading_prompt_cache ─────────────────────────────
ALTER TABLE grading_prompt_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "grading_prompt_cache_read" ON grading_prompt_cache
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "grading_prompt_cache_admin" ON grading_prompt_cache
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
