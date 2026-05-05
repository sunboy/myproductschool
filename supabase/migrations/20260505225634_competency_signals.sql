-- Store rollup competency signals directly on completed challenge attempts.
-- `mental_models_breakdown` already exists in older environments via 026b, but
-- keeping this idempotent lets fresh or drifted databases converge safely.
ALTER TABLE public.challenge_attempts
  ADD COLUMN IF NOT EXISTS mental_models_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS primary_competency TEXT,
  ADD COLUMN IF NOT EXISTS weakest_competency TEXT;

CREATE INDEX IF NOT EXISTS idx_challenge_attempts_primary_competency
  ON public.challenge_attempts (primary_competency)
  WHERE primary_competency IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_challenge_attempts_weakest_competency
  ON public.challenge_attempts (weakest_competency)
  WHERE weakest_competency IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user_weakest_competency
  ON public.challenge_attempts (user_id, weakest_competency, completed_at DESC)
  WHERE weakest_competency IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_challenge_attempts_mental_models_breakdown_gin
  ON public.challenge_attempts USING GIN (mental_models_breakdown)
  WHERE mental_models_breakdown IS NOT NULL;
