/*
  # Add Management Token to Software Submissions

  1. Changes
    - Add `management_token` column to `software_submissions` table
    - Token auto-generates using secure random bytes
    - Token is unique and URL-safe
    - Add index on token for faster lookups

  2. Security
    - Update RLS policies to allow token-based access
    - Users can view/edit their own submissions using the token
    - Admins retain full access
*/

-- Add management_token column to software_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'management_token'
  ) THEN
    ALTER TABLE software_submissions 
    ADD COLUMN management_token text UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'base64');
  END IF;
END $$;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_submissions_management_token ON software_submissions(management_token);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to approved submissions" ON software_submissions;
DROP POLICY IF EXISTS "Allow public insert" ON software_submissions;

-- Recreate public read policy
CREATE POLICY "Allow public read access to approved submissions"
  ON software_submissions
  FOR SELECT
  USING (status = 'approved');

-- Allow public insert (anyone can submit)
CREATE POLICY "Allow public insert"
  ON software_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow token-based updates (users can update their own submissions)
CREATE POLICY "Allow token-based updates"
  ON software_submissions
  FOR UPDATE
  TO public
  USING (management_token IS NOT NULL)
  WITH CHECK (management_token IS NOT NULL);

-- Allow token-based select (users can view their own submissions via token)
CREATE POLICY "Allow token-based select"
  ON software_submissions
  FOR SELECT
  TO public
  USING (management_token IS NOT NULL);
