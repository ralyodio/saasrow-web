/*
  # Add Newsletter History Table

  1. New Tables
    - `newsletter_history`
      - `id` (uuid, primary key) - Unique identifier
      - `subject` (text) - Newsletter subject line
      - `content` (text) - Newsletter content
      - `recipient_count` (integer) - Number of recipients
      - `sent_by` (text) - Admin email who sent it
      - `mailgun_id` (text) - Mailgun message ID
      - `sent_at` (timestamptz) - When newsletter was sent
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on newsletter_history table
    - No public access - admin only via edge functions

  3. Indexes
    - Index on sent_at for sorting by date
*/

CREATE TABLE IF NOT EXISTS newsletter_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  content text NOT NULL,
  recipient_count integer DEFAULT 0,
  sent_by text NOT NULL,
  mailgun_id text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_history_sent_at ON newsletter_history(sent_at DESC);

ALTER TABLE newsletter_history ENABLE ROW LEVEL SECURITY;
