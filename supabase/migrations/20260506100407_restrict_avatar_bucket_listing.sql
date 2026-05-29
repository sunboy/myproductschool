-- Public avatar object URLs continue to work without a broad SELECT policy.
-- Dropping this policy prevents clients from listing every object in the public bucket.
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
