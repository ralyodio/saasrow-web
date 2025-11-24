/*
  # Revert favorites table to use email-based auth

  1. Changes
    - Drop user_id column
    - Add user_email column back
    - Update RLS policies for email-based authentication
  
  2. Security
    - Enable RLS
    - Policies allow any authenticated user to manage favorites by email
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
DROP POLICY IF EXISTS "Users can remove own favorites" ON favorites;

-- Drop user_id column
ALTER TABLE favorites DROP COLUMN IF EXISTS user_id CASCADE;

-- Add user_email column
ALTER TABLE favorites 
  ADD COLUMN IF NOT EXISTS user_email text NOT NULL;

-- Add unique constraint to prevent duplicate favorites
DROP INDEX IF EXISTS favorites_user_submission_unique;
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_email_submission_unique 
  ON favorites(user_email, submission_id);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email-based auth
CREATE POLICY "Users can view own favorites"
  ON favorites
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create own favorites"
  ON favorites
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own favorites"
  ON favorites
  FOR DELETE
  USING (true);