/*
  # Add Share Tracking System

  1. Changes
    - Add `share_count` column to `software_submissions` table
    - Add `last_share_reset` timestamp to track 24-hour trending windows
    - Create index on share_count for efficient sorting

  2. Notes
    - share_count tracks total shares
    - last_share_reset helps identify trending items (10+ shares in 24h)
    - Default values ensure backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'share_count'
  ) THEN
    ALTER TABLE software_submissions ADD COLUMN share_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'last_share_reset'
  ) THEN
    ALTER TABLE software_submissions ADD COLUMN last_share_reset timestamptz DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_software_submissions_share_count ON software_submissions(share_count DESC);
