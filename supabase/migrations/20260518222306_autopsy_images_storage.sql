-- Public, published HackProduct autopsy image storage.
-- Generated images are uploaded server-side by the publishing pipeline.

INSERT INTO storage.buckets (id, name, public)
VALUES ('autopsy-images', 'autopsy-images', true)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public;

DROP POLICY IF EXISTS "autopsy_images_public_read" ON storage.objects;
CREATE POLICY "autopsy_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'autopsy-images');

DROP POLICY IF EXISTS "autopsy_images_service_all" ON storage.objects;
CREATE POLICY "autopsy_images_service_all"
  ON storage.objects FOR ALL
  USING ((select auth.role()) = 'service_role' AND bucket_id = 'autopsy-images')
  WITH CHECK ((select auth.role()) = 'service_role' AND bucket_id = 'autopsy-images');

CREATE TABLE IF NOT EXISTS public.autopsy_story_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id       uuid REFERENCES public.autopsy_stories(id) ON DELETE SET NULL,
  company_slug   text NOT NULL,
  story_slug     text NOT NULL,
  version        integer NOT NULL DEFAULT 1 CHECK (version > 0),
  status         text NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'approved', 'published', 'archived')),
  content_sha256 text,
  published_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_slug, story_slug, version)
);

CREATE TABLE IF NOT EXISTS public.autopsy_story_images (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id         uuid REFERENCES public.autopsy_stories(id) ON DELETE SET NULL,
  story_version_id uuid NOT NULL REFERENCES public.autopsy_story_versions(id) ON DELETE CASCADE,
  role             text NOT NULL CHECK (
    role IN (
      'hero',
      'hatch-narrator',
      'failure-mechanism',
      'evidence-card',
      'lesson-frame',
      'thumbnail',
      'social-cover'
    )
  ),
  bucket           text NOT NULL DEFAULT 'autopsy-images',
  storage_path     text NOT NULL,
  public_url       text,
  width            integer NOT NULL CHECK (width > 0),
  height           integer NOT NULL CHECK (height > 0),
  alt              text NOT NULL CHECK (length(trim(alt)) > 0),
  caption          text NOT NULL CHECK (length(trim(caption)) > 0),
  sha256           text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  watermark        boolean NOT NULL DEFAULT true,
  qa_status        text NOT NULL DEFAULT 'draft' CHECK (qa_status IN ('missing', 'draft', 'approved')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_version_id, role),
  UNIQUE (bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_autopsy_story_versions_story
  ON public.autopsy_story_versions(company_slug, story_slug, version DESC);

CREATE INDEX IF NOT EXISTS idx_autopsy_story_images_version
  ON public.autopsy_story_images(story_version_id, role);

CREATE INDEX IF NOT EXISTS idx_autopsy_story_images_storage_path
  ON public.autopsy_story_images(bucket, storage_path);

ALTER TABLE public.autopsy_story_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopsy_story_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "autopsy_story_versions_public_read" ON public.autopsy_story_versions;
CREATE POLICY "autopsy_story_versions_public_read"
  ON public.autopsy_story_versions FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "autopsy_story_images_public_read" ON public.autopsy_story_images;
CREATE POLICY "autopsy_story_images_public_read"
  ON public.autopsy_story_images FOR SELECT
  USING (
    qa_status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM public.autopsy_story_versions v
      WHERE v.id = autopsy_story_images.story_version_id
        AND v.status = 'published'
    )
  );

DROP POLICY IF EXISTS "autopsy_story_versions_service_all" ON public.autopsy_story_versions;
CREATE POLICY "autopsy_story_versions_service_all"
  ON public.autopsy_story_versions FOR ALL
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "autopsy_story_images_service_all" ON public.autopsy_story_images;
CREATE POLICY "autopsy_story_images_service_all"
  ON public.autopsy_story_images FOR ALL
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

GRANT SELECT ON public.autopsy_story_versions TO anon, authenticated;
GRANT SELECT ON public.autopsy_story_images TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.autopsy_story_versions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.autopsy_story_images TO service_role;

DROP TRIGGER IF EXISTS autopsy_story_versions_updated_at ON public.autopsy_story_versions;
CREATE TRIGGER autopsy_story_versions_updated_at
  BEFORE UPDATE ON public.autopsy_story_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS autopsy_story_images_updated_at ON public.autopsy_story_images;
CREATE TRIGGER autopsy_story_images_updated_at
  BEFORE UPDATE ON public.autopsy_story_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
