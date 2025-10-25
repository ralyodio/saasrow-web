/*
  # Add admin authentication helper and update RLS policies
  
  1. Helper Function
    - `is_admin()` - Checks if the current authenticated user's email matches ADMIN_EMAIL
    - Returns true if user is authenticated and email matches the admin email
  
  2. RLS Policy Updates for news_posts
    - Add policies for authenticated admin to INSERT, UPDATE, DELETE news posts
    - Admin is identified by matching email from auth.jwt()
  
  ## Security
  - Only authenticated users whose email matches ADMIN_EMAIL can modify news posts
  - Uses Supabase auth system for proper authentication
  - Existing SELECT policies remain unchanged (anon and public access)
*/

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is authenticated and email matches admin email
  RETURN (
    auth.uid() IS NOT NULL 
    AND auth.jwt() ->> 'email' = current_setting('app.settings.admin_email', true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for admin operations on news_posts
CREATE POLICY "Admin can insert news posts"
  ON news_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update news posts"
  ON news_posts
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete news posts"
  ON news_posts
  FOR DELETE
  TO authenticated
  USING (is_admin());