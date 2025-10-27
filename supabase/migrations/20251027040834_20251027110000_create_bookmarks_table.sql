/*
  # Create Bookmarks/Favorites System

  1. New Tables
    - `bookmarks`
      - `id` (uuid, primary key) - Unique identifier for the bookmark
      - `user_email` (text, not null) - Email of the user who bookmarked (indexed)
      - `submission_id` (uuid, not null) - Reference to the software submission (foreign key)
      - `created_at` (timestamptz) - When the bookmark was created
      - Unique constraint on (user_email, submission_id) to prevent duplicate bookmarks

  2. Security
    - Enable RLS on `bookmarks` table
    - Users can only view their own bookmarks
    - Users can only create bookmarks with their own email
    - Users can only delete their own bookmarks
    - Anonymous users cannot access bookmarks

  3. Important Notes
    - Uses email-based authentication instead of user IDs
    - Prevents duplicate bookmarks with unique constraint
    - Cascades deletion if submission is deleted
*/

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  submission_id uuid NOT NULL REFERENCES software_submissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_email, submission_id)
);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_email ON bookmarks(user_email);

-- Create index for faster lookups by submission
CREATE INDEX IF NOT EXISTS idx_bookmarks_submission_id ON bookmarks(submission_id);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks
  FOR SELECT
  TO authenticated
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can create bookmarks with their own email
CREATE POLICY "Users can create own bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks
  FOR DELETE
  TO authenticated
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');
