-- Hatch session memory over time: every lightweight Hatch touchpoint (hint
-- request, self-check, quick-take submit, explicit client log) lands here so
-- future Hatch turns can reference what the learner has been doing.
-- Additive only: new table, no changes to existing objects.

create table if not exists public.hatch_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists hatch_interactions_user_created_idx
  on public.hatch_interactions (user_id, created_at desc);

alter table public.hatch_interactions enable row level security;

-- Users can write and read their own interaction rows.
drop policy if exists "hatch_interactions_insert_own" on public.hatch_interactions;
create policy "hatch_interactions_insert_own"
  on public.hatch_interactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "hatch_interactions_select_own" on public.hatch_interactions;
create policy "hatch_interactions_select_own"
  on public.hatch_interactions for select
  using (auth.uid() = user_id);

-- Service role bypasses RLS by default; explicit policy kept for clarity.
drop policy if exists "hatch_interactions_service_all" on public.hatch_interactions;
create policy "hatch_interactions_service_all"
  on public.hatch_interactions for all
  to service_role
  using (true)
  with check (true);
