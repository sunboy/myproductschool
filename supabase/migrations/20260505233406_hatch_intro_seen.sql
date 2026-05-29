ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_seen_hatch_intro BOOLEAN;

ALTER TABLE public.profiles
  ALTER COLUMN has_seen_hatch_intro SET DEFAULT false;

UPDATE public.profiles
SET has_seen_hatch_intro = false
WHERE has_seen_hatch_intro IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN has_seen_hatch_intro SET NOT NULL;
