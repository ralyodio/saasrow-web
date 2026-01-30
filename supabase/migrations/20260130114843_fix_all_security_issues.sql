/*
  # Fix All Security Issues
  
  ## Changes Made
  
  1. **Add Missing Indexes**
     - Add index on `comments.user_id` for FK performance
     - Add index on `favorites.submission_id` for FK performance  
     - Add index on `user_tokens.user_id` for FK performance
  
  2. **Remove Unused Index**
     - Drop `idx_votes_user_id` (not being used)
  
  3. **Optimize RLS Policies**
     - Update `favorites` policies to use `(select auth.uid())` instead of `auth.uid()`
     - Update `users` policies to use `(select auth.uid())` instead of `auth.uid()`
     - This prevents re-evaluation on each row for better performance
  
  4. **Fix Security Definer Views**
     - Recreate `expired_free_listings` without SECURITY DEFINER
     - Recreate `expiring_free_listings` without SECURITY DEFINER
  
  5. **Fix RLS Policy Always True**
     - Update `community_posts` INSERT policy to properly validate user authentication
  
  ## Notes
  - Manual dashboard configuration still required:
    - Auth DB Connection Strategy (change to percentage-based)
    - Enable Leaked Password Protection
*/

-- ============================================================================
-- 1. ADD MISSING INDEXES
-- ============================================================================

-- Index for comments.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Index for favorites.submission_id foreign key
CREATE INDEX IF NOT EXISTS idx_favorites_submission_id ON favorites(submission_id);

-- Index for user_tokens.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);

-- ============================================================================
-- 2. REMOVE UNUSED INDEX
-- ============================================================================

DROP INDEX IF EXISTS idx_votes_user_id;

-- ============================================================================
-- 3. OPTIMIZE RLS POLICIES
-- ============================================================================

-- Drop and recreate favorites policies with optimized auth checks
DROP POLICY IF EXISTS "Authenticated users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Authenticated users can create own favorites" ON favorites;
DROP POLICY IF EXISTS "Authenticated users can delete own favorites" ON favorites;

CREATE POLICY "Authenticated users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Authenticated users can create own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Authenticated users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop and recreate users policies with optimized auth checks
DROP POLICY IF EXISTS "Authenticated users can read own record" ON users;

CREATE POLICY "Authenticated users can read own record"
  ON users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

-- ============================================================================
-- 4. FIX SECURITY DEFINER VIEWS
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS expired_free_listings;
DROP VIEW IF EXISTS expiring_free_listings;

-- Recreate without SECURITY DEFINER
CREATE VIEW expiring_free_listings AS
SELECT 
  id,
  title,
  url,
  tier,
  status,
  submitted_at,
  expires_at
FROM software_submissions
WHERE tier = 'free'
  AND status = 'approved'
  AND expires_at IS NOT NULL
  AND expires_at > now()
  AND expires_at <= now() + interval '7 days';

CREATE VIEW expired_free_listings AS
SELECT 
  id,
  title,
  url,
  tier,
  status,
  submitted_at,
  expires_at
FROM software_submissions
WHERE tier = 'free'
  AND status = 'approved'
  AND expires_at IS NOT NULL
  AND expires_at <= now();

-- ============================================================================
-- 5. FIX RLS POLICY ALWAYS TRUE
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Anyone can create community posts" ON community_posts;

-- Recreate with proper authentication check
CREATE POLICY "Authenticated users can create community posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
