-- First-party blog: posts authored by agents, approved in Linear, published
-- via the CRON_SECRET blog-publish route. Public reads only see published rows.

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  dek text,
  body_markdown text not null,
  hero_image_url text,
  og_image_url text,
  tags text[] not null default '{}',
  author_name text not null default 'Hatch',
  reading_minutes int,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  seo_keywords text[] not null default '{}',
  canonical_url text,
  published_at timestamptz,
  newsletter_sent_at timestamptz,
  linear_issue_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_status_published_at_idx
  on public.blog_posts (status, published_at desc);
create index blog_posts_tags_gin_idx on public.blog_posts using gin (tags);

do $$ begin
  create trigger blog_posts_updated_at
    before update on public.blog_posts
    for each row execute function update_updated_at();
exception when duplicate_object then null; end $$;

alter table public.blog_posts enable row level security;

-- Anonymous/authenticated readers see published posts only; drafts are
-- reachable exclusively through the service-role preview route.
create policy "blog_posts public read published"
  on public.blog_posts for select
  using (status = 'published');
