-- Server-only Claude Code workspace and reusable-user-state snapshots.
-- Keep bucket metadata aligned with production while explicitly forcing any
-- pre-existing bucket back to private.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('cc-sessions', 'cc-sessions', false),
  ('cc-user-state', 'cc-user-state', false)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = false;

-- RLS policies are permissive by default. This restrictive policy prevents a
-- later broad client policy from exposing either server-only bucket while
-- leaving every other storage bucket unaffected. service_role bypasses RLS.
DROP POLICY IF EXISTS "cc_snapshot_buckets_deny_client_access" ON storage.objects;
CREATE POLICY "cc_snapshot_buckets_deny_client_access"
ON storage.objects
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (bucket_id NOT IN ('cc-sessions', 'cc-user-state'))
WITH CHECK (bucket_id NOT IN ('cc-sessions', 'cc-user-state'));
