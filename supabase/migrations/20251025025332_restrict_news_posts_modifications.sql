/*
  # Restrict news posts modifications to service role only
  
  This migration removes policies that allow authenticated users to modify news posts.
  Since the admin interface uses client-side auth (not Supabase auth), we need to
  ensure that only the service role (used by edge functions) can modify posts.
  
  Anonymous users can still view all posts (needed for admin dashboard).
  Public users can view only published posts (needed for public news pages).
  
  ## Changes
  - DROP policies allowing authenticated users to INSERT, UPDATE, DELETE
  - Keep SELECT policies for anon (admin dashboard) and public (published posts only)
*/

-- Drop policies that allow authenticated users to modify posts
DROP POLICY IF EXISTS "Admins can insert posts" ON news_posts;
DROP POLICY IF EXISTS "Admins can update posts" ON news_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON news_posts;
DROP POLICY IF EXISTS "Admins can view all posts" ON news_posts;

-- The remaining policies are:
-- 1. "Anon can view all posts" - allows admin dashboard to fetch all posts
-- 2. "Anyone can view published posts" - allows public to view published posts only

-- Note: INSERT/UPDATE/DELETE operations will only work with service role key
-- (used by edge functions like generate-news-post)