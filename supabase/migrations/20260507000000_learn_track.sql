-- supabase/migrations/066_learn_track.sql
alter table public.learn_modules
  add column if not exists track text
  check (track in ('foundations', 'systems', 'ai-llms', 'new-era', 'product-thinking'));

-- Backfill all existing product-thinking modules
update public.learn_modules
  set track = 'product-thinking'
  where track is null;
