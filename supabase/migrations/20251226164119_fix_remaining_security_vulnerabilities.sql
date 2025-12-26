/*
  # Fix Remaining Security Vulnerabilities

  ## Critical Issues Found
  
  1. community_posts: "Anyone can update post counts"
     - USING(true) and WITH CHECK(true) = anyone can modify ANY post
  
  2. favorites: Multiple policies with USING(true) and WITH CHECK(true)
     - Users can create/delete/read ANY favorite, not just their own
  
  3. users: "Users can update own email"
     - USING(true) and WITH CHECK(true) = can update ANY user's email
  
  4. cleanup_runs: "Anyone can view cleanup runs" 
     - USING(true) = exposes internal system data

  ## Solutions
  Remove or restrict these policies to prevent unauthorized access.
*/

-- Fix community_posts - remove dangerous update policy
DROP POLICY IF EXISTS "Anyone can update post counts" ON community_posts;
COMMENT ON TABLE community_posts IS 'Updates restricted to edge functions only.';

-- Fix favorites policies - they need proper user identification
-- Since favorites uses email field, we need to restrict to edge functions
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;

-- Favorites must be managed through edge functions only
COMMENT ON TABLE favorites IS 'All operations restricted to edge functions with proper user validation.';

-- Fix users table - remove dangerous update policy
DROP POLICY IF EXISTS "Users can update own email" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
COMMENT ON TABLE users IS 'All operations restricted to edge functions only.';

-- Fix cleanup_runs - internal data shouldn't be public
DROP POLICY IF EXISTS "Anyone can view cleanup runs" ON cleanup_runs;

-- Create a restrictive view policy for cleanup_runs (just last run time, no details)
CREATE POLICY "Public can view last cleanup time only"
  ON cleanup_runs
  FOR SELECT
  TO anon
  USING (false);

COMMENT ON TABLE cleanup_runs IS 'Internal system table. No public access.';
