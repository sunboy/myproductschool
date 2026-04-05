-- Learn section tables

create table if not exists public.learn_modules (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  tagline     text not null,
  difficulty  text not null check (difficulty in ('foundation','beginner','intermediate','advanced','new-era','entry-point')),
  chapter_count int not null default 0,
  est_minutes int not null default 0,
  cover_color text not null,
  accent_color text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.learn_chapters (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.learn_modules(id) on delete cascade,
  slug        text not null,
  title       text not null,
  subtitle    text not null default '',
  sort_order  int not null default 0,
  hook_text   text not null default '',
  body_mdx    text not null default '',
  created_at  timestamptz not null default now(),
  unique (module_id, slug)
);

create table if not exists public.user_learn_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  module_id   uuid not null references public.learn_modules(id) on delete cascade,
  chapter_id  uuid not null references public.learn_chapters(id) on delete cascade,
  completed_at timestamptz default now(),
  unique (user_id, chapter_id)
);

-- RLS
alter table public.learn_modules enable row level security;
alter table public.learn_chapters enable row level security;
alter table public.user_learn_progress enable row level security;

create policy "learn_modules_public_read" on public.learn_modules
  for select using (true);

create policy "learn_chapters_public_read" on public.learn_chapters
  for select using (true);

create policy "user_learn_progress_own" on public.user_learn_progress
  for all using (auth.uid() = user_id);
