/*
  # Remove admin RLS policies - use edge functions for admin operations
  
  Since we're using edge functions with service role key for all admin operations,
  we don't need RLS policies for authenticated users. The edge functions will
  verify the admin email directly.
  
  ## Changes
  - Drop admin RLS policies
  - Drop is_admin helper function
  - Keep only SELECT policies (anon and public)
*/

-- Drop the admin policies
DROP POLICY IF EXISTS "Admin can insert news posts" ON news_posts;
DROP POLICY IF EXISTS "Admin can update news posts" ON news_posts;
DROP POLICY IF EXISTS "Admin can delete news posts" ON news_posts;

-- Drop the helper function
DROP FUNCTION IF EXISTS is_admin();