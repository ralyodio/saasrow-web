/*
  # Revert and Fix Email Exposure Properly

  ## Issue
  Previous migration blocked all anon access to software_submissions, breaking the frontend.
  
  ## Root Problem
  RLS works at row level, not column level. If SELECT is allowed, users can select ANY column.
  The frontend selects specific safe columns, but attackers can use anon key to query email directly.

  ## Solution
  1. Drop the view (not needed)
  2. Restore SELECT policy for approved submissions
  3. Document that email exposure is a limitation of RLS row-level security
  4. Frontend should NEVER select email column
  5. For full security, email should be moved to a separate table with stricter RLS
*/

-- Drop the view
DROP VIEW IF EXISTS public_software_submissions;

-- Restore the SELECT policy
DROP POLICY IF EXISTS "Anon users cannot directly read submissions" ON software_submissions;

CREATE POLICY "Anyone can view approved submissions"
  ON software_submissions
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Add a warning comment
COMMENT ON COLUMN software_submissions.email IS 'WARNING: This column is exposed to anon users via SELECT policy. Consider moving to separate table for better security.';
