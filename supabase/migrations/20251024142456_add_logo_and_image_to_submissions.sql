/*
  # Add logo and image fields to software submissions

  1. Changes
    - Add `logo` column to `software_submissions` table
      - Type: text (URL to logo/favicon)
      - Nullable: true
      - Stores logo URL fetched from website
    - Add `image` column to `software_submissions` table
      - Type: text (URL to preview image)
      - Nullable: true
      - Stores preview/OG image URL fetched from website
  
  2. Notes
    - Logo and image are fetched automatically by the fetch-metadata function
    - These fields help display visual elements in listings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'logo'
  ) THEN
    ALTER TABLE software_submissions ADD COLUMN logo text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'image'
  ) THEN
    ALTER TABLE software_submissions ADD COLUMN image text;
  END IF;
END $$;