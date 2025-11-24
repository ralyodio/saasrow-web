/*
  # Normalize URLs and Add Unique Constraint

  1. Changes
    - Normalize all existing URLs by trimming trailing slashes
    - Add unique constraint to url column in software_submissions table

  2. Notes
    - This prevents duplicate submissions with URLs that differ only by trailing slashes
    - URLs like "https://example.com" and "https://example.com/" will be treated as the same
*/

-- First, normalize all existing URLs by removing trailing slashes
UPDATE software_submissions
SET url = regexp_replace(url, '/+$', '')
WHERE url ~ '/+$';

-- Now add unique constraint to prevent future duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'software_submissions_url_key'
    AND conrelid = 'software_submissions'::regclass
  ) THEN
    ALTER TABLE software_submissions ADD CONSTRAINT software_submissions_url_key UNIQUE (url);
  END IF;
END $$;
