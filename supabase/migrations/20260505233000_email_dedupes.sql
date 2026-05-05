-- Generic transactional email dedupe/audit table.

CREATE TABLE IF NOT EXISTS public.email_dedupes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  resend_email_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_dedupes_user_created
  ON public.email_dedupes(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS email_dedupes_template_created
  ON public.email_dedupes(template, created_at DESC);

ALTER TABLE public.email_dedupes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_dedupes'
      AND policyname = 'Users can view own transactional emails'
  ) THEN
    CREATE POLICY "Users can view own transactional emails"
      ON public.email_dedupes FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE public.email_dedupes IS 'Audit trail and idempotency table for transactional emails sent through Resend.';
COMMENT ON COLUMN public.email_dedupes.dedupe_key IS 'Stable key used with Resend idempotency to prevent duplicate sends.';
