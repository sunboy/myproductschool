-- Search by catalog ID badge (ALGO-1661, SQL-2237, partial "223").
-- display_number is an integer; PostgREST filters cannot cast, so expose a
-- generated text mirror for ilike matching. Additive only.

alter table public.challenges
  add column if not exists display_number_text text
  generated always as (display_number::text) stored;

create index if not exists idx_challenges_display_number_text
  on public.challenges (display_number_text)
  where display_number_text is not null;
