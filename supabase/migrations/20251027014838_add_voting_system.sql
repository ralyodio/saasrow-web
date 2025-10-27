/*
  # Add Voting System

  1. New Tables
    - `votes`
      - `id` (uuid, primary key)
      - `submission_id` (uuid, foreign key to software_submissions)
      - `user_id` (uuid, references auth.users)
      - `vote_type` (text, either 'upvote' or 'downvote')
      - `created_at` (timestamptz)
      - Unique constraint on (submission_id, user_id) to prevent duplicate votes
  
  2. Changes to Existing Tables
    - Add `upvotes` column to software_submissions (integer, default 0)
    - Add `downvotes` column to software_submissions (integer, default 0)
  
  3. Security
    - Enable RLS on votes table
    - Policy: Authenticated users can insert their own votes
    - Policy: Authenticated users can view all votes
    - Policy: Authenticated users can update only their own votes
    - Policy: Authenticated users can delete only their own votes
  
  4. Functions
    - Trigger function to update vote counts in software_submissions when votes are inserted/updated/deleted
*/

-- Add vote count columns to software_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'upvotes'
  ) THEN
    ALTER TABLE software_submissions ADD COLUMN upvotes integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'downvotes'
  ) THEN
    ALTER TABLE software_submissions ADD COLUMN downvotes integer DEFAULT 0;
  END IF;
END $$;

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES software_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(submission_id, user_id)
);

-- Enable RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for votes table
CREATE POLICY "Authenticated users can view all votes"
  ON votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert their own votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own votes"
  ON votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE software_submissions 
      SET upvotes = upvotes + 1 
      WHERE id = NEW.submission_id;
    ELSE
      UPDATE software_submissions 
      SET downvotes = downvotes + 1 
      WHERE id = NEW.submission_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'upvote' AND NEW.vote_type = 'downvote' THEN
      UPDATE software_submissions 
      SET upvotes = upvotes - 1, downvotes = downvotes + 1 
      WHERE id = NEW.submission_id;
    ELSIF OLD.vote_type = 'downvote' AND NEW.vote_type = 'upvote' THEN
      UPDATE software_submissions 
      SET upvotes = upvotes + 1, downvotes = downvotes - 1 
      WHERE id = NEW.submission_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE software_submissions 
      SET upvotes = upvotes - 1 
      WHERE id = OLD.submission_id;
    ELSE
      UPDATE software_submissions 
      SET downvotes = downvotes - 1 
      WHERE id = OLD.submission_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS update_vote_counts_trigger ON votes;
CREATE TRIGGER update_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counts();