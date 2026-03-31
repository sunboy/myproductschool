-- Unified Luma context layer
-- Stores structured context entries for Luma coaching (interview dates, notes summaries, etc.)

create table if not exists luma_context (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  context_type text not null,   -- e.g. 'interview_date', 'notes_summary', 'weak_area'
  source_id   text not null default 'default',  -- e.g. note id, 'profile', or 'default'
  content     text not null,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint luma_context_unique unique (user_id, context_type, source_id)
);

-- RLS
alter table luma_context enable row level security;

create policy "Users can read own luma context"
  on luma_context for select
  using (auth.uid() = user_id);

create policy "Service role can manage luma context"
  on luma_context for all
  using (true)
  with check (true);

-- Index for fast lookup by user
create index if not exists luma_context_user_idx on luma_context (user_id);
