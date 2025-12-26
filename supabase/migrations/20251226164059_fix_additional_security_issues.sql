/*
  # Fix Additional Security Vulnerabilities

  ## Issues Found
  1. social_links: "Anyone can create social links" with WITH CHECK(true)
     - Allows anyone to create social links for ANY submission
  
  2. newsletter_subscriptions: "Public can view subscriptions" with USING(true)
     - Exposes ALL email addresses publicly

  ## Solutions
  1. Remove direct insert access to social_links (use edge functions only)
  2. Remove public read access to newsletter_subscriptions
*/

-- Fix social_links
DROP POLICY IF EXISTS "Anyone can create social links" ON social_links;
COMMENT ON TABLE social_links IS 'Inserts restricted to edge functions only. Use /functions/v1/submissions.';

-- Fix newsletter_subscriptions - remove public read access
DROP POLICY IF EXISTS "Public can view subscriptions" ON newsletter_subscriptions;

-- Keep insert policy but make it more restrictive
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON newsletter_subscriptions;
CREATE POLICY "Public can subscribe to newsletter"
  ON newsletter_subscriptions
  FOR INSERT
  TO anon
  WITH CHECK (
    email IS NOT NULL 
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );
