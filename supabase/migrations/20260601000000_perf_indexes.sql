-- Performance indexes for hot read paths.
--
-- 1. challenge_attempts(user_id, challenge_id): 24+ query sites filter attempts
--    by user_id and challenge_id together (e.g. /api/domains, /api/prep,
--    study-plan progress, "have I done this challenge" checks). The existing
--    idx_challenge_attempts_user_id only covers user_id, forcing a filter scan
--    on challenge_id for each.
-- 2. profiles(xp_total): the dashboard leaderboard rank computes
--    count(*) where xp_total > $me (src/lib/data/dashboard.ts getLeaderboardPeek)
--    and the top-3 query orders by xp_total DESC. Both are seq scans without
--    an index on xp_total.
--
-- Guarded with catalog checks so the migration is safe regardless of how the
-- columns were introduced, and idempotent on re-run.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'challenge_attempts'
      AND column_name = 'challenge_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user_challenge
      ON public.challenge_attempts(user_id, challenge_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'xp_total'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_xp_total
      ON public.profiles(xp_total DESC);
  END IF;
END $$;
