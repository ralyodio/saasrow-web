/*
  # Create social_links table

  1. New Tables
    - `social_links`
      - `id` (uuid, primary key)
      - `submission_id` (uuid, foreign key to software_submissions)
      - `platform` (text) - e.g., 'twitter', 'github', 'facebook', 'discord', 'linkedin'
      - `url` (text) - the full URL to the social profile
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `social_links` table
    - Add policies for public read access
    - Add policies for authenticated users to manage their own links
*/

CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES software_submissions(id) ON DELETE CASCADE,
  platform text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social links"
  ON social_links
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert social links for their submissions"
  ON social_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM software_submissions
      WHERE software_submissions.id = submission_id
      AND software_submissions.email = (SELECT auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can update social links for their submissions"
  ON social_links
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM software_submissions
      WHERE software_submissions.id = submission_id
      AND software_submissions.email = (SELECT auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can delete social links for their submissions"
  ON social_links
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM software_submissions
      WHERE software_submissions.id = submission_id
      AND software_submissions.email = (SELECT auth.jwt() ->> 'email')
    )
  );

CREATE INDEX IF NOT EXISTS social_links_submission_id_idx ON social_links(submission_id);
