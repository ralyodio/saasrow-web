/*
  # Fix favorites table to use auth.users

  1. Changes
    - Drop old RLS policies that depend on user_email
    - Drop `user_email` column
    - Add `user_id` column referencing auth.users(id)
    - Add proper RLS policies using auth.uid()
  
  2. Security
    - Enable RLS
    - Only authenticated users can manage their own favorites
    - Uses auth.uid() for proper authentication
*/

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own bookmarks" ON favorites;
DROP POLICY IF EXISTS "Users can create own bookmarks" ON favorites;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON favorites;
DROP POLICY IF EXISTS "Anyone can read favorites" ON favorites;
DROP POLICY IF EXISTS "Anyone can insert favorites" ON favorites;
DROP POLICY IF EXISTS "Anyone can delete favorites" ON favorites;

-- Add user_id column
ALTER TABLE favorites 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the old column
ALTER TABLE favorites DROP COLUMN IF EXISTS user_email CASCADE;

-- Make user_id required
ALTER TABLE favorites 
  ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint to prevent duplicate favorites
DROP INDEX IF EXISTS favorites_user_submission_unique;
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_submission_unique 
  ON favorites(user_id, submission_id);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own favorites"
  ON favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);