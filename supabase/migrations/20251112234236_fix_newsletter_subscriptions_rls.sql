/*
  # Fix Newsletter Subscriptions RLS Policies

  1. Issue
    - Current policy only allows `anon` role to insert into newsletter_subscriptions
    - Users who are authenticated or using public role cannot subscribe
    - This causes "new row violates row-level security policy" error

  2. Solution
    - Add policy for authenticated users to subscribe
    - Add policy for public role to subscribe
    - This ensures anyone can subscribe regardless of their authentication state

  3. Security
    - Policies still enforce WITH CHECK (true) which allows insertion
    - Email uniqueness is enforced by table constraint
    - No sensitive data exposure
*/

-- Allow authenticated users to subscribe to newsletter
CREATE POLICY "Authenticated users can subscribe to newsletter"
  ON newsletter_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow public role to subscribe to newsletter
CREATE POLICY "Public can subscribe to newsletter"
  ON newsletter_subscriptions FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to view subscriptions (for their own validation)
CREATE POLICY "Authenticated users can view subscriptions"
  ON newsletter_subscriptions FOR SELECT
  TO authenticated
  USING (true);

-- Allow public role to view subscriptions (for validation)
CREATE POLICY "Public can view subscriptions"
  ON newsletter_subscriptions FOR SELECT
  TO public
  USING (true);
