-- Supabase-backed HackProduct autopsy content.
-- Local markdown/TS files are generation artifacts; runtime article content reads from these tables.

CREATE TABLE IF NOT EXISTS public.autopsy_companies (
  slug       text PRIMARY KEY,
  name       text NOT NULL CHECK (length(trim(name)) > 0),
  dek        text NOT NULL DEFAULT '',
  industry   text NOT NULL DEFAULT 'Product',
  accent     text NOT NULL DEFAULT '#2c7a52',
  thesis     text NOT NULL DEFAULT '',
  timeline   jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(timeline) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.autopsy_content_stories (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_slug         text NOT NULL REFERENCES public.autopsy_companies(slug) ON DELETE CASCADE,
  slug                 text NOT NULL,
  story_type           text NOT NULL CHECK (story_type IN ('company_teardown', 'feature_autopsy')),
  title                text NOT NULL CHECK (length(trim(title)) > 0),
  dek                  text NOT NULL DEFAULT '',
  queue_rank           integer NOT NULL DEFAULT 999 CHECK (queue_rank > 0),
  status               text NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'researching', 'proofreading', 'approved', 'published', 'archived')),
  proofread_status     text NOT NULL DEFAULT 'not_started'
                       CHECK (proofread_status IN ('not_started', 'needs_edits', 'approved')),
  canonical_path       text NOT NULL,
  estimated_read_time  text NOT NULL DEFAULT '8 min read',
  tags                 text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_summary       text NOT NULL DEFAULT '',
  replacement_policy   text NOT NULL DEFAULT '',
  featured             boolean NOT NULL DEFAULT false,
  sources              jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(sources) = 'array'),
  metrics              jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(metrics) = 'array'),
  quick_read           jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(quick_read) = 'array'),
  flow                 jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(flow) = 'array'),
  backdrop_word        text,
  timeline             jsonb CHECK (timeline IS NULL OR jsonb_typeof(timeline) = 'array'),
  comparison           jsonb CHECK (comparison IS NULL OR jsonb_typeof(comparison) = 'object'),
  quote                jsonb CHECK (quote IS NULL OR jsonb_typeof(quote) = 'object'),
  principle            jsonb CHECK (principle IS NULL OR jsonb_typeof(principle) = 'object'),
  source_pack_summary  text,
  content_sha256       text CHECK (content_sha256 IS NULL OR content_sha256 ~ '^[0-9a-f]{64}$'),
  published_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_slug, slug)
);

CREATE INDEX IF NOT EXISTS idx_autopsy_content_stories_company
  ON public.autopsy_content_stories(company_slug, queue_rank);

CREATE INDEX IF NOT EXISTS idx_autopsy_content_stories_status
  ON public.autopsy_content_stories(status, story_type, queue_rank);

CREATE INDEX IF NOT EXISTS idx_autopsy_content_stories_featured
  ON public.autopsy_content_stories(featured)
  WHERE featured = true;

ALTER TABLE public.autopsy_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopsy_content_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "autopsy_companies_public_read" ON public.autopsy_companies;
CREATE POLICY "autopsy_companies_public_read"
  ON public.autopsy_companies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "autopsy_content_stories_public_read" ON public.autopsy_content_stories;
CREATE POLICY "autopsy_content_stories_public_read"
  ON public.autopsy_content_stories FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "autopsy_companies_service_all" ON public.autopsy_companies;
CREATE POLICY "autopsy_companies_service_all"
  ON public.autopsy_companies FOR ALL
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "autopsy_content_stories_service_all" ON public.autopsy_content_stories;
CREATE POLICY "autopsy_content_stories_service_all"
  ON public.autopsy_content_stories FOR ALL
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

GRANT SELECT ON public.autopsy_companies TO anon, authenticated;
GRANT SELECT ON public.autopsy_content_stories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.autopsy_companies TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.autopsy_content_stories TO service_role;

DROP TRIGGER IF EXISTS autopsy_companies_updated_at ON public.autopsy_companies;
CREATE TRIGGER autopsy_companies_updated_at
  BEFORE UPDATE ON public.autopsy_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS autopsy_content_stories_updated_at ON public.autopsy_content_stories;
CREATE TRIGGER autopsy_content_stories_updated_at
  BEFORE UPDATE ON public.autopsy_content_stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
