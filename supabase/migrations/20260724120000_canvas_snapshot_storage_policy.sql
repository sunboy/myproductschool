-- Canvas PNG uploads failed silently on ~90% of attempts: the browser client
-- uploads to challenge-assets/canvas-snapshots/{attemptId}.png as the signed-in
-- user, but storage.objects had no policy allowing authenticated writes to the
-- bucket, so every upload hit "new row violates row-level security policy" and
-- the client's catch returned null. Scope: authenticated users may insert and
-- upsert-update ONLY under the canvas-snapshots/ prefix. Reads stay public
-- (the bucket is public).

create policy "canvas snapshots insert (authenticated)"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'challenge-assets'
    and name like 'canvas-snapshots/%'
  );

create policy "canvas snapshots update (authenticated)"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'challenge-assets'
    and name like 'canvas-snapshots/%'
  )
  with check (
    bucket_id = 'challenge-assets'
    and name like 'canvas-snapshots/%'
  );

-- Upsert (INSERT ... ON CONFLICT DO UPDATE) requires SELECT access to the
-- conflicting row under RLS; the client uploads with upsert:true, so a
-- select policy is part of the fix (applied as
-- canvas_snapshot_storage_select_policy on the live DB).
create policy "canvas snapshots select (authenticated)"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'challenge-assets'
    and name like 'canvas-snapshots/%'
  );
