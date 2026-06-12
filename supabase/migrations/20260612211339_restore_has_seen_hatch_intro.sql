-- Restore profiles.has_seen_hatch_intro: schema_migrations recorded
-- 20260505233406_hatch_intro_seen as applied but the column was absent from
-- the live DB (drift of unknown origin). Its absence made the /api/profile
-- select error, which the route surfaced as 404 "Profile not found" — so
-- every client session rendered without profile data ("?" avatar in the top
-- nav, onboarding auto-start never firing).
--
-- Applied to the live DB on 2026-06-12 via MCP; this file mirrors that
-- migration so repo and live histories stay aligned.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_seen_hatch_intro BOOLEAN;

ALTER TABLE public.profiles
  ALTER COLUMN has_seen_hatch_intro SET DEFAULT false;

UPDATE public.profiles
SET has_seen_hatch_intro = false
WHERE has_seen_hatch_intro IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN has_seen_hatch_intro SET NOT NULL;
