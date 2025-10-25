/*
  # Add public INSERT policy for software submissions

  1. Changes
    - Add INSERT policy for authenticated users
    - Add INSERT policy for public (in case anon doesn't cover it)
    
  2. Security
    - Maintains restriction that only pending submissions can be inserted
*/

DO $$ BEGIN
  -- Add policy for authenticated users (if any are logged in)
  DROP POLICY IF EXISTS "Authenticated users can submit software" ON software_submissions;
  CREATE POLICY "Authenticated users can submit software"
    ON software_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (status IS NULL OR status = 'pending');
  
  -- Add policy for public role as well
  DROP POLICY IF EXISTS "Public can submit software" ON software_submissions;
  CREATE POLICY "Public can submit software"
    ON software_submissions
    FOR INSERT
    TO public
    WITH CHECK (status IS NULL OR status = 'pending');
END $$;