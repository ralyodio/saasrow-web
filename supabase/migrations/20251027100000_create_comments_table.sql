/*
  # Create Comments and Reviews System

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `submission_id` (uuid, foreign key to software_submissions)
      - `author_name` (text, required)
      - `author_email` (text, required)
      - `content` (text, required)
      - `rating` (integer, 1-5 stars, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `ip_address` (text, for spam prevention)
      - `is_verified` (boolean, default false)

  2. Security
    - Enable RLS on `comments` table
    - Allow anonymous users to read approved comments
    - No direct insert/update/delete (use edge function for validation)

  3. Indexes
    - Index on submission_id for fast lookups
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES software_submissions(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL,
  content text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ip_address text,
  is_verified boolean DEFAULT false,
  CONSTRAINT content_length CHECK (char_length(content) >= 10 AND char_length(content) <= 2000),
  CONSTRAINT name_length CHECK (char_length(author_name) >= 2 AND char_length(author_name) <= 100)
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read verified comments"
  ON comments
  FOR SELECT
  USING (is_verified = true);

CREATE INDEX IF NOT EXISTS idx_comments_submission_id ON comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_verified ON comments(is_verified) WHERE is_verified = true;

CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();
