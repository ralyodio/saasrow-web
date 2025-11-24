/*
  # Add View Count to Software Submissions

  1. Changes
    - Add `view_count` column to software_submissions table
      - Type: integer
      - Default: 0
      - Tracks how many times a listing has been viewed
    
  2. Notes
    - View count will be incremented via edge function for better control
    - No RLS changes needed as this is a public metric
    - Existing submissions will start with 0 views
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE software_submissions ADD COLUMN view_count integer DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_software_submissions_view_count ON software_submissions(view_count DESC);
