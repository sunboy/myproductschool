-- Add company field to waitlist for segmentation
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS company TEXT;
