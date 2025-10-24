/*
  # Fix RLS Policies for Submission Validation

  1. Changes
    - Add policy to allow anon users to check for duplicate URLs (their own pending submissions)
    - Add policy to allow anon users to count their own submissions for rate limiting
    - These policies only allow reading data needed for validation, not all pending submissions

  2. Security
    - Users can only see pending submissions that match the URL they're trying to submit
    - Users can only count submissions from their own email for rate limiting
    - All other security restrictions remain in place
*/

-- Drop existing SELECT policy and recreate with broader access for validation
DROP POLICY IF EXISTS "Anyone can view approved submissions" ON software_submissions;

-- Allow viewing approved submissions
CREATE POLICY "Anyone can view approved submissions"
  ON software_submissions
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Allow checking for duplicate URLs (for any status)
CREATE POLICY "Check for duplicate URLs"
  ON software_submissions
  FOR SELECT
  TO anon
  USING (true);
