-- The HackProduct Letter audience: materialized subscriber rows seeded from
-- users + leads (opt-out) plus organic blog/footer subscribes. One opaque
-- unsubscribe token per row is the single suppression mechanism; the nightly
-- reconcile folds in-app marketing opt-outs and lead unsubscribes INTO
-- suppression, never out of it.

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_norm text not null,
  name text,
  source text not null
    check (source in ('user', 'lead', 'blog', 'footer', 'import')),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed', 'bounced', 'complained')),
  unsubscribe_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index newsletter_subscribers_email_norm_key
  on public.newsletter_subscribers (email_norm);
create unique index newsletter_subscribers_unsub_token_key
  on public.newsletter_subscribers (unsubscribe_token);
create index newsletter_subscribers_subscribed_idx
  on public.newsletter_subscribers (status) where status = 'subscribed';

do $$ begin
  create trigger newsletter_subscribers_updated_at
    before update on public.newsletter_subscribers
    for each row execute function update_updated_at();
exception when duplicate_object then null; end $$;

-- No public policies: subscribe, unsubscribe, seed, and send all go through
-- service-role routes. RLS on with zero policies denies anon/authenticated.
alter table public.newsletter_subscribers enable row level security;
