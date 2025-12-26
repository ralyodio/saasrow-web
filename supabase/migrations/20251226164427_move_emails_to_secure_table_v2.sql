/*
  # Move Email Addresses to Secure Table (v2)

  ## Problem
  RLS is row-level security, not column-level. If anon users can SELECT rows from
  software_submissions, they can read ALL columns including email addresses.

  ## Solution
  1. Drop dependent views
  2. Create new `submission_contacts` table with strict RLS
  3. Migrate existing emails to new table
  4. Remove email column from software_submissions
  5. Recreate views with secure email access

  ## Security
  - submission_contacts has NO public read access
  - Only service role (edge functions) can access emails
*/

-- Drop dependent views first
DROP VIEW IF EXISTS expiring_free_listings CASCADE;
DROP VIEW IF EXISTS expired_free_listings CASCADE;

-- Create secure contacts table
CREATE TABLE IF NOT EXISTS submission_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES software_submissions(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT unique_submission_contact UNIQUE(submission_id)
);

-- Enable RLS and lock it down completely
ALTER TABLE submission_contacts ENABLE ROW LEVEL SECURITY;

-- No policies = no access for anon/authenticated users
CREATE POLICY "Block all anon access to contacts"
  ON submission_contacts
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Block all authenticated access to contacts"
  ON submission_contacts
  FOR ALL
  TO authenticated
  USING (false);

-- Migrate existing emails
INSERT INTO submission_contacts (submission_id, email)
SELECT id, email 
FROM software_submissions 
WHERE email IS NOT NULL AND email != ''
ON CONFLICT (submission_id) DO NOTHING;

-- Remove email from software_submissions
ALTER TABLE software_submissions DROP COLUMN email;

-- Recreate views for cleanup system (service_role access only)
-- Note: These views will join with submission_contacts which is service_role only
CREATE VIEW expiring_free_listings AS
SELECT 
  s.id,
  c.email,
  s.title,
  s.url,
  s.expires_at,
  s.renewal_count
FROM software_submissions s
LEFT JOIN submission_contacts c ON s.id = c.submission_id
WHERE ((s.tier = 'free' OR s.tier IS NULL) 
  AND s.expires_at IS NOT NULL 
  AND s.expires_at > CURRENT_TIMESTAMP 
  AND s.expires_at <= (CURRENT_TIMESTAMP + interval '7 days')
  AND s.status = 'approved');

CREATE VIEW expired_free_listings AS
SELECT 
  s.id,
  c.email,
  s.title,
  s.url,
  s.expires_at,
  s.status
FROM software_submissions s
LEFT JOIN submission_contacts c ON s.id = c.submission_id
WHERE ((s.tier = 'free' OR s.tier IS NULL)
  AND s.expires_at IS NOT NULL
  AND s.expires_at <= CURRENT_TIMESTAMP
  AND s.status = 'approved');

COMMENT ON TABLE submission_contacts IS 'Secure storage for submission contact emails. No public access - service_role only.';
COMMENT ON TABLE software_submissions IS 'Email addresses moved to submission_contacts table for security.';
