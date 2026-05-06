ALTER TABLE public.challenge_attempts
  ADD COLUMN IF NOT EXISTS share_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS challenge_attempts_share_id_unique
  ON public.challenge_attempts(share_id)
  WHERE share_id IS NOT NULL;

COMMENT ON COLUMN public.challenge_attempts.share_id IS 'Opaque public token for user-enabled scorecard sharing.';
