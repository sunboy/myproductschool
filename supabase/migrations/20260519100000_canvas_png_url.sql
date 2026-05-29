-- Add canvas_png_url column to challenge_attempts
ALTER TABLE challenge_attempts
  ADD COLUMN IF NOT EXISTS canvas_png_url TEXT;

-- Create challenge-assets storage bucket for canvas PNG snapshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('challenge-assets', 'challenge-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload their own canvas snapshots
CREATE POLICY "auth users can upload canvas snapshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'challenge-assets');

-- RLS: anyone can read canvas snapshots (bucket is public)
CREATE POLICY "public can read canvas snapshots"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'challenge-assets');
