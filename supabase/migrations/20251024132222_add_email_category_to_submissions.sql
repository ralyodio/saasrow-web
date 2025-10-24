/*
  # Add Email and Category to Software Submissions

  ## Changes
  - Add `email` column to `software_submissions` table for contact information
  - Add `category` column to `software_submissions` table for software classification
  - Both fields are required for new submissions

  ## Columns Added
  - `email` (text, required) - Contact email for submission follow-up
  - `category` (text, required) - Software category (Software, Security, Productivity, etc.)

  ## Notes
  - Email field includes validation constraint
  - Category field allows flexible categorization
*/

-- Add email column to software_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'email'
  ) THEN
    ALTER TABLE software_submissions ADD COLUMN email text NOT NULL DEFAULT '';
    ALTER TABLE software_submissions ADD CONSTRAINT valid_submission_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

-- Add category column to software_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'category'
  ) THEN
    ALTER TABLE software_submissions ADD COLUMN category text NOT NULL DEFAULT 'Software';
  END IF;
END $$;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_submissions_category ON software_submissions(category);
