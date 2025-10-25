/*
  # Create Screenshot Gallery Table

  1. New Tables
    - `submission_screenshots` - Store screenshots captured from submission URLs
      - `id` (uuid, primary key)
      - `submission_id` (uuid, foreign key to software_submissions)
      - `screenshot_url` (text) - Public URL to the screenshot in storage
      - `page_url` (text) - The URL that was screenshotted
      - `page_title` (text) - Title/label for the screenshot
      - `storage_path` (text) - Path in Supabase storage
      - `captured_at` (timestamptz) - When screenshot was taken
      - `created_at` (timestamptz)
  
  2. Storage Buckets
    - `submission-screenshots` - For storing screenshot images
    
  3. Security
    - Enable RLS on submission_screenshots table
    - Add policy for public read access
    - Add policy for insert via edge functions
    - Add storage policies for public read and authenticated write
    
  4. Important Notes
    - Only Basic and Premium tier submissions will have screenshots
    - Screenshots are automatically captured from top-level navigation links
    - Storage bucket has 10MB file size limit per screenshot
*/

-- Create submission screenshots table
CREATE TABLE IF NOT EXISTS submission_screenshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES software_submissions(id) ON DELETE CASCADE,
  screenshot_url text NOT NULL,
  page_url text NOT NULL,
  page_title text DEFAULT '',
  storage_path text NOT NULL,
  captured_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE submission_screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view screenshots"
  ON submission_screenshots FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Service role can insert screenshots"
  ON submission_screenshots FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update screenshots"
  ON submission_screenshots FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete screenshots"
  ON submission_screenshots FOR DELETE
  TO service_role
  USING (true);

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('submission-screenshots', 'submission-screenshots', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for screenshots bucket
CREATE POLICY "Public read access for screenshots"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'submission-screenshots');

CREATE POLICY "Service role can upload screenshots"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'submission-screenshots');

CREATE POLICY "Service role can update screenshots"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'submission-screenshots');

CREATE POLICY "Service role can delete screenshots"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'submission-screenshots');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_submission_screenshots_submission_id 
  ON submission_screenshots(submission_id);
