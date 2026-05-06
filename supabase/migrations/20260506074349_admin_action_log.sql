CREATE TABLE IF NOT EXISTS public.admin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_action_log_created_at
  ON public.admin_action_log(created_at DESC);

CREATE INDEX IF NOT EXISTS admin_action_log_admin_created
  ON public.admin_action_log(admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_action_log_target
  ON public.admin_action_log(target_type, target_id);

ALTER TABLE public.admin_action_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_action_log'
      AND policyname = 'Service role can manage admin action log'
  ) THEN
    CREATE POLICY "Service role can manage admin action log"
      ON public.admin_action_log FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_action_log'
      AND policyname = 'Admins can view admin action log'
  ) THEN
    CREATE POLICY "Admins can view admin action log"
      ON public.admin_action_log FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

COMMENT ON TABLE public.admin_action_log IS 'Immutable audit trail for successful admin write actions.';
COMMENT ON COLUMN public.admin_action_log.admin_id IS 'Authenticated admin profile id when available; null for secret-protected operational admin routes.';
COMMENT ON COLUMN public.admin_action_log.before IS 'Optional snapshot or summary before the admin action.';
COMMENT ON COLUMN public.admin_action_log.after IS 'Optional snapshot or summary after the admin action.';
