/*
  # Migrate Additional Users to Users Table

  ## Overview
  This migration ensures all users from various sources (comments, newsletter, user_tokens) 
  are added to the users table if they don't already exist.

  ## Changes

  ### 1. Migrate Users from Comments
  - Add verified comment authors to users table

  ### 2. Migrate Users from Newsletter Subscribers (if table exists)
  - Add newsletter subscribers to users table

  ### 3. Migrate Users from User Tokens
  - Add any users from user_tokens that aren't in users table yet

  ### 4. Important Notes
  - Uses ON CONFLICT DO NOTHING to avoid duplicates
  - Preserves earliest created_at date for each user
  - Safe to run multiple times
*/

-- Migrate verified comment authors to users table
INSERT INTO users (email, created_at)
SELECT DISTINCT author_email, MIN(created_at) as created_at
FROM comments
WHERE author_email IS NOT NULL 
  AND is_verified = true
  AND author_email NOT IN (SELECT email FROM users)
GROUP BY author_email
ON CONFLICT (email) DO NOTHING;

-- Migrate newsletter subscribers to users table (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'newsletter_subscribers'
  ) THEN
    INSERT INTO users (email, created_at)
    SELECT DISTINCT email, MIN(created_at) as created_at
    FROM newsletter_subscribers
    WHERE email IS NOT NULL
      AND email NOT IN (SELECT email FROM users)
    GROUP BY email
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;

-- Migrate users from user_tokens table
INSERT INTO users (email, created_at)
SELECT DISTINCT email, MIN(created_at) as created_at
FROM user_tokens
WHERE email IS NOT NULL
  AND email NOT IN (SELECT email FROM users)
GROUP BY email
ON CONFLICT (email) DO NOTHING;

-- Update user_id in user_tokens for newly created users
UPDATE user_tokens ut
SET user_id = u.id
FROM users u
WHERE ut.email = u.email AND ut.user_id IS NULL;

-- Update user_id in comments for newly created users
UPDATE comments c
SET user_id = u.id
FROM users u
WHERE c.author_email = u.email 
  AND c.is_verified = true 
  AND c.user_id IS NULL;
