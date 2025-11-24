/*
  # Create Analytics Tables for Software Submissions

  1. New Tables
    - `submission_clicks`
      - `id` (uuid, primary key) - Unique identifier for each click event
      - `submission_id` (uuid, foreign key) - Reference to software_submissions
      - `clicked_at` (timestamptz) - When the click occurred
      - `referrer` (text, nullable) - Where the click came from
      - `user_agent` (text, nullable) - Browser/device information
      - `ip_hash` (text, nullable) - Hashed IP for privacy (not storing actual IP)
      
    - `submission_analytics_daily`
      - `id` (uuid, primary key) - Unique identifier
      - `submission_id` (uuid, foreign key) - Reference to software_submissions
      - `date` (date) - The date for this analytics record
      - `views` (integer) - Number of views on this date
      - `clicks` (integer) - Number of clicks on this date
      - `unique_visitors` (integer) - Estimated unique visitors
      - Unique constraint on (submission_id, date)
  
  2. Indexes
    - Index on submission_clicks(submission_id, clicked_at) for efficient querying
    - Index on submission_analytics_daily(submission_id, date) for fast lookups
  
  3. Security
    - Enable RLS on both tables
    - Only allow reading via edge functions (service role key)
    - No public INSERT/UPDATE/DELETE allowed
*/

CREATE TABLE IF NOT EXISTS submission_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES software_submissions(id) ON DELETE CASCADE,
  clicked_at timestamptz DEFAULT now(),
  referrer text,
  user_agent text,
  ip_hash text
);

CREATE TABLE IF NOT EXISTS submission_analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES software_submissions(id) ON DELETE CASCADE,
  date date NOT NULL,
  views integer DEFAULT 0,
  clicks integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  UNIQUE(submission_id, date)
);

CREATE INDEX IF NOT EXISTS idx_submission_clicks_submission_date 
  ON submission_clicks(submission_id, clicked_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_submission_date 
  ON submission_analytics_daily(submission_id, date DESC);

ALTER TABLE submission_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage clicks"
  ON submission_clicks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage daily analytics"
  ON submission_analytics_daily
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
