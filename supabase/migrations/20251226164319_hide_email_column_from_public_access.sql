/*
  # Hide Email Column from Public Access

  ## Problem
  The software_submissions table exposes submitter email addresses via the public SELECT policy.
  Anyone can read all emails from approved submissions.

  ## Solution
  Create a public view that excludes sensitive columns (email, management_token, payment info).
  Users should query the view instead of the table directly.
  
  ## Migration Strategy
  1. Create a secure public view without sensitive data
  2. Update RLS to block direct table access for anon users
  3. Allow anon users to read from the view instead
*/

-- Create a public-safe view without sensitive data
CREATE OR REPLACE VIEW public_software_submissions AS
SELECT 
  id,
  title,
  url,
  description,
  category,
  tags,
  logo,
  image,
  status,
  tier,
  featured,
  is_featured,
  featured_until,
  analytics_enabled,
  homepage_featured,
  custom_profile_url,
  newsletter_featured,
  monthly_analytics_enabled,
  social_media_mentions,
  category_logo_enabled,
  submitted_at,
  created_at,
  view_count,
  upvotes,
  downvotes,
  share_count,
  last_share_reset,
  user_id,
  expires_at
FROM software_submissions
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public_software_submissions TO anon;
GRANT SELECT ON public_software_submissions TO authenticated;

-- Update the SELECT policy to prevent direct email access
DROP POLICY IF EXISTS "Anyone can view approved submissions" ON software_submissions;

CREATE POLICY "Anon users cannot directly read submissions"
  ON software_submissions
  FOR SELECT
  TO anon
  USING (false);

-- Service role can still access everything
COMMENT ON VIEW public_software_submissions IS 'Public view of approved submissions without sensitive data (email, tokens, payment info)';
COMMENT ON TABLE software_submissions IS 'Direct table access blocked for anon users. Use public_software_submissions view or edge functions.';
