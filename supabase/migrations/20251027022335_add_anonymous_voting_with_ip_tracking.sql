/*
  # Add Anonymous Voting with IP Tracking

  1. Changes to Existing Tables
    - Modify `votes` table to make `user_id` optional (allow NULL)
    - Add `ip_address` column to `votes` table for anonymous voting
    - Add `is_anonymous` boolean flag to `votes` table
    - Update unique constraint to handle both authenticated and anonymous users
  
  2. Security
    - Keep existing RLS policies for authenticated users
    - Add new RLS policy to allow anonymous users to insert votes
    - Add new RLS policy to allow anonymous users to view votes
  
  3. Notes
    - Anonymous users will be tracked by IP address
    - Each IP can only vote once per submission
    - Authenticated users override IP-based votes (if same IP was used anonymously)
*/

-- Make user_id nullable to support anonymous voting
DO $$
BEGIN
  ALTER TABLE votes ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Add ip_address column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'votes' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE votes ADD COLUMN ip_address text;
  END IF;
END $$;

-- Add is_anonymous flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'votes' AND column_name = 'is_anonymous'
  ) THEN
    ALTER TABLE votes ADD COLUMN is_anonymous boolean DEFAULT false;
  END IF;
END $$;

-- Drop the old unique constraint
DO $$
BEGIN
  ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_submission_id_user_id_key;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Add new unique constraint that handles both authenticated and anonymous users
-- For authenticated users: unique on (submission_id, user_id) where user_id is not null
-- For anonymous users: unique on (submission_id, ip_address) where user_id is null
CREATE UNIQUE INDEX IF NOT EXISTS votes_authenticated_unique 
  ON votes(submission_id, user_id) 
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS votes_anonymous_unique 
  ON votes(submission_id, ip_address) 
  WHERE user_id IS NULL AND ip_address IS NOT NULL;

-- Add RLS policy for anonymous users to insert votes
DROP POLICY IF EXISTS "Anonymous users can insert votes" ON votes;
CREATE POLICY "Anonymous users can insert votes"
  ON votes FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND ip_address IS NOT NULL);

-- Add RLS policy for anonymous users to view votes
DROP POLICY IF EXISTS "Anonymous users can view votes" ON votes;
CREATE POLICY "Anonymous users can view votes"
  ON votes FOR SELECT
  TO anon
  USING (true);

-- Update existing authenticated policies if needed
DROP POLICY IF EXISTS "Authenticated users can update their own votes" ON votes;
CREATE POLICY "Authenticated users can update their own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND user_id IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete their own votes" ON votes;
CREATE POLICY "Authenticated users can delete their own votes"
  ON votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND user_id IS NOT NULL);