/*
  # Fix Security Issues - Comprehensive

  ## 1. Performance & Indexing
    - **Add missing index**: `votes.user_id` foreign key needs covering index
    - **Remove unused indexes**: Drop indexes that are not being used by queries
      - `idx_user_tokens_user_id` on `user_tokens.user_id`
      - `idx_comments_user_id` on `comments.user_id`
      - `idx_favorites_submission_id` on `favorites.submission_id`

  ## 2. Row Level Security Policies
    - **favorites table**: Add restrictive policies (currently has RLS enabled but no policies)
      - SELECT: Authenticated users can view their own favorites
      - INSERT: Authenticated users can add their own favorites
      - DELETE: Authenticated users can delete their own favorites
      - UPDATE: Disabled (favorites are immutable)
    
    - **users table**: Add restrictive policies (currently has RLS enabled but no policies)
      - SELECT: Users can only read their own user record
      - INSERT: Disabled (user creation via edge functions only)
      - UPDATE: Disabled (user updates via edge functions only)
      - DELETE: Disabled (user deletion via edge functions only)

  ## 3. Security Definer Views
    - Recreate views WITHOUT SECURITY DEFINER property
    - Views should inherit caller's permissions, not elevated privileges
    - Affects: `expiring_free_listings`, `expired_free_listings`

  ## 4. Manual Configuration Required
    These items CANNOT be fixed via migration and require Supabase dashboard configuration:
    
    - **Auth DB Connection Strategy**: 
      Navigate to: Settings > Database > Connection pooling
      Change Auth connection mode from "Session" to "Transaction" with percentage allocation
    
    - **Leaked Password Protection**: 
      Navigate to: Authentication > Settings > Security
      Enable "Leaked password protection" toggle

  ## Security Notes
    - All policies follow principle of least privilege
    - Policies are restrictive by default
    - Users can only access their own data
    - Edge functions use service_role for administrative operations
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEX
-- ============================================================================

-- Add index for votes.user_id foreign key to improve join performance
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- ============================================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================================

-- These indexes were created but are not being used by any queries
DROP INDEX IF EXISTS idx_user_tokens_user_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_favorites_submission_id;

-- ============================================================================
-- 3. ADD RLS POLICIES FOR FAVORITES TABLE
-- ============================================================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
DROP POLICY IF EXISTS "Users can remove own favorites" ON favorites;

-- Authenticated users can view only their own favorites
CREATE POLICY "Authenticated users can view own favorites"
  ON favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can create their own favorites
CREATE POLICY "Authenticated users can create own favorites"
  ON favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete only their own favorites
CREATE POLICY "Authenticated users can delete own favorites"
  ON favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. ADD RLS POLICIES FOR USERS TABLE
-- ============================================================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Authenticated users can only read their own user record
CREATE POLICY "Authenticated users can read own record"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Block all insert operations (must use edge functions)
CREATE POLICY "No direct user inserts"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "No anon user inserts"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (false);

-- Block all update operations (must use edge functions)
CREATE POLICY "No direct user updates"
  ON users
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No anon user updates"
  ON users
  FOR UPDATE
  TO anon
  USING (false)
  WITH CHECK (false);

-- Block all delete operations (must use edge functions)
CREATE POLICY "No direct user deletes"
  ON users
  FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "No anon user deletes"
  ON users
  FOR DELETE
  TO anon
  USING (false);

-- ============================================================================
-- 5. RECREATE VIEWS WITHOUT SECURITY DEFINER
-- ============================================================================

-- Drop and recreate expiring_free_listings without SECURITY DEFINER
DROP VIEW IF EXISTS expiring_free_listings CASCADE;
CREATE VIEW expiring_free_listings AS
SELECT 
  id,
  title,
  url,
  expires_at,
  renewal_count
FROM software_submissions
WHERE (tier = 'free' OR tier IS NULL)
AND expires_at IS NOT NULL
AND expires_at > CURRENT_TIMESTAMP
AND expires_at <= CURRENT_TIMESTAMP + interval '7 days'
AND status = 'approved';

-- Drop and recreate expired_free_listings without SECURITY DEFINER
DROP VIEW IF EXISTS expired_free_listings CASCADE;
CREATE VIEW expired_free_listings AS
SELECT 
  id,
  title,
  url,
  expires_at,
  status
FROM software_submissions
WHERE (tier = 'free' OR tier IS NULL)
AND expires_at IS NOT NULL
AND expires_at <= CURRENT_TIMESTAMP
AND status = 'approved';

-- Grant SELECT permissions on views
GRANT SELECT ON expiring_free_listings TO anon, authenticated;
GRANT SELECT ON expired_free_listings TO anon, authenticated;

-- ============================================================================
-- 6. ADD HELPFUL COMMENTS
-- ============================================================================

COMMENT ON POLICY "Authenticated users can view own favorites" ON favorites 
  IS 'Users can only see favorites they created with their own user_id';

COMMENT ON POLICY "Authenticated users can create own favorites" ON favorites 
  IS 'Users can only create favorites with their own user_id';

COMMENT ON POLICY "Authenticated users can delete own favorites" ON favorites 
  IS 'Users can only delete favorites they own';

COMMENT ON POLICY "Authenticated users can read own record" ON users 
  IS 'Users can only read their own user record via auth.uid()';

COMMENT ON POLICY "No direct user inserts" ON users 
  IS 'User creation must go through edge functions with proper validation';

COMMENT ON VIEW expiring_free_listings 
  IS 'Shows free listings expiring within 7 days. Email removed for security - use service_role to access.';

COMMENT ON VIEW expired_free_listings 
  IS 'Shows expired free listings. Email removed for security - use service_role to access.';
