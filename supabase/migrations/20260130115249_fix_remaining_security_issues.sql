/*
  # Fix Remaining Security Issues
  
  ## Changes Made
  
  1. **Add Missing Index**
     - Add index on `votes.user_id` for FK performance
  
  2. **Remove Unused Indexes**
     - Drop `idx_user_tokens_user_id` (not being used)
     - Drop `idx_comments_user_id` (not being used)
     - Drop `idx_favorites_submission_id` (not being used)
  
  3. **Fix Security Definer Views**
     - Recreate `expired_free_listings` with explicit security_invoker
     - Recreate `expiring_free_listings` with explicit security_invoker
  
  ## Notes
  - Manual dashboard configuration still required:
    - Auth DB Connection Strategy (change to percentage-based in Settings → Database)
*/

-- ============================================================================
-- 1. ADD MISSING INDEX FOR VOTES TABLE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- ============================================================================
-- 2. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_user_tokens_user_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_favorites_submission_id;

-- ============================================================================
-- 3. FIX SECURITY DEFINER VIEWS
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS expired_free_listings;
DROP VIEW IF EXISTS expiring_free_listings;

-- Recreate views with explicit security context
CREATE VIEW expiring_free_listings 
WITH (security_invoker=true)
AS
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

CREATE VIEW expired_free_listings 
WITH (security_invoker=true)
AS
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

-- Grant permissions
GRANT SELECT ON expiring_free_listings TO anon, authenticated;
GRANT SELECT ON expired_free_listings TO anon, authenticated;
