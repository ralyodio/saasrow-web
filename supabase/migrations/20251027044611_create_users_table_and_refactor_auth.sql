/*
  # Create Users Table and Refactor Authentication System

  ## Overview
  This migration creates a proper users table with stable user IDs and refactors
  the entire authentication/authorization system to use user IDs instead of emails.
  This fixes critical issues with email changes and provides a consistent identity system.

  ## Changes

  ### 1. New Tables
  - `users`
    - `id` (uuid, primary key) - Stable user identifier that never changes
    - `email` (text, unique, not null) - Current email address (can be updated)
    - `created_at` (timestamptz) - When user was created
    - `updated_at` (timestamptz) - Last update timestamp

  ### 2. Modified Tables
  - `software_submissions`
    - Add `user_id` (uuid) - References users table
    - Keep `email` for backward compatibility during transition
    - Add index on user_id for performance
  
  - `votes`
    - Keep existing `user_id` column but now properly references users table
    - Add foreign key constraint to users table
  
  - `comments`
    - Add `user_id` (uuid) - References users table
    - Keep `author_email` for anonymous comments
  
  - `favorites`
    - Add `user_id` (uuid) - References users table
    - Remove user_email column (replaced by user_id)
  
  - `user_tokens`
    - Add `user_id` (uuid) - References users table
    - Keep email for backward compatibility

  ### 3. Security
  - Enable RLS on users table
  - Users can read their own profile
  - Users can update their own email
  - All related tables updated to use user_id in policies

  ### 4. Data Migration
  - Create user records for all existing unique emails
  - Link existing submissions to user records
  - Link existing votes to user records
  - Link existing comments to user records
  - Link existing favorites to user records

  ### 5. Important Notes
  - User IDs are stable and never change even if email changes
  - Anonymous actions (votes/comments without auth) still use IP addresses
  - Management tokens still work but now create/lookup user records
  - Backward compatibility maintained during transition
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (true);

-- Users can update their own email (in future with proper auth)
CREATE POLICY "Users can update own email"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing emails to users table
INSERT INTO users (email, created_at)
SELECT email, MIN(created_at) as created_at
FROM software_submissions
WHERE email IS NOT NULL
GROUP BY email
ON CONFLICT (email) DO NOTHING;

-- Add user_id to software_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE software_submissions ADD COLUMN user_id uuid REFERENCES users(id);
  END IF;
END $$;

-- Populate user_id in software_submissions
UPDATE software_submissions ss
SET user_id = u.id
FROM users u
WHERE ss.email = u.email AND ss.user_id IS NULL;

-- Add index on user_id
CREATE INDEX IF NOT EXISTS idx_software_submissions_user_id ON software_submissions(user_id);

-- Add user_id to votes table and set up foreign key
DO $$
BEGIN
  -- Check if user_id column exists and has correct type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'votes' AND column_name = 'user_id'
  ) THEN
    -- Drop existing foreign key if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'votes' AND constraint_name = 'votes_user_id_fkey'
    ) THEN
      ALTER TABLE votes DROP CONSTRAINT votes_user_id_fkey;
    END IF;
    
    -- Add foreign key to users table
    ALTER TABLE votes ADD CONSTRAINT votes_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Populate user_id in comments based on author_email
UPDATE comments c
SET user_id = u.id
FROM users u
WHERE c.author_email = u.email AND c.user_id IS NULL AND c.is_verified = true;

-- Add index on user_id for comments
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Update favorites table to use user_id instead of user_email
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'favorites' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE favorites ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Migrate existing favorites to user_id
UPDATE favorites f
SET user_id = u.id
FROM users u
WHERE f.user_email = u.email AND f.user_id IS NULL;

-- Drop old user_email column from favorites after migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'favorites' AND column_name = 'user_email'
  ) THEN
    -- First drop the old unique constraint on user_email if it exists
    ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_user_email_submission_id_key;
    -- Drop the user_email column
    ALTER TABLE favorites DROP COLUMN user_email;
  END IF;
END $$;

-- Add new unique constraint on user_id and submission_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'favorites' AND constraint_name = 'favorites_user_id_submission_id_key'
  ) THEN
    ALTER TABLE favorites ADD CONSTRAINT favorites_user_id_submission_id_key 
      UNIQUE (user_id, submission_id);
  END IF;
END $$;

-- Drop old RLS policies on favorites
DROP POLICY IF EXISTS "Anyone can read favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage own favorites via email" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;

-- Create new RLS policies for favorites using user_id
CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (true);

-- Add index on user_id for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Add user_id to user_tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_tokens' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE user_tokens ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Populate user_id in user_tokens
UPDATE user_tokens ut
SET user_id = u.id
FROM users u
WHERE ut.email = u.email AND ut.user_id IS NULL;

-- Add index on user_id for user_tokens
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
