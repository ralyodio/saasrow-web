/*
  # Allow anonymous users to view news posts
  
  This migration adds a policy to allow anonymous (anon) users to view all news posts,
  which is needed for the admin dashboard that uses the anon key to fetch posts.
  
  ## Changes
  - Add policy for anon role to SELECT all news posts
*/

CREATE POLICY "Anon can view all posts"
  ON news_posts
  FOR SELECT
  TO anon
  USING (true);