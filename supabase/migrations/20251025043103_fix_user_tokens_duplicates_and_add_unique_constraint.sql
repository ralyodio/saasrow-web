/*
  # Fix user_tokens table duplicates and add unique constraint

  1. Changes
    - Delete duplicate rows keeping only the most recent one per email
    - Add unique constraint on email column to prevent future duplicates
    
  2. Security
    - No RLS changes needed
*/

-- First, delete duplicates keeping only the most recent row per email
DELETE FROM user_tokens
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id
  FROM user_tokens
  ORDER BY email, created_at DESC
);

-- Add unique constraint on email
ALTER TABLE user_tokens
ADD CONSTRAINT user_tokens_email_key UNIQUE (email);