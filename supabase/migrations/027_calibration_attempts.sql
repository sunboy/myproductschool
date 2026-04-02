-- calibration_attempts: stores each user's calibration MCQ responses and computed scores

create table if not exists public.calibration_attempts (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  responses_json jsonb       not null default '{}'::jsonb,
  status         text        not null default 'grading'
                             check (status in ('grading', 'complete', 'failed')),
  scores_json    jsonb,      -- { frame, list, optimize, win } each 0–100
  percentile     integer,    -- 0–100
  created_at     timestamptz not null default now()
);

create index if not exists calibration_attempts_user_id_idx
  on public.calibration_attempts (user_id, created_at desc);

alter table public.calibration_attempts enable row level security;

create policy "calibration_attempts_own"
  on public.calibration_attempts
  for all using (auth.uid() = user_id);
