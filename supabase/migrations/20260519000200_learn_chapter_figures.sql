-- Add structured figures column to learn_chapters.
-- Replaces inline <figure><svg>...</svg></figure> strings in body_mdx with
-- a jsonb array of typed figure objects. Prose keeps {{figure:N}} tokens
-- where each figure should render.

alter table public.learn_chapters
  add column if not exists figures jsonb not null default '[]'::jsonb;

comment on column public.learn_chapters.figures is
  'Array of structured figure objects. Each has {kind, ...data}. Rendered by typed React components. Referenced from body_mdx via {{figure:N}} tokens.';
