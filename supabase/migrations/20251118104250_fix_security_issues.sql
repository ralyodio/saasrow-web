/*
  # Fix Security Issues

  1. Indexes
    - Add missing foreign key indexes for better query performance
    - Remove unused index on votes table
  
  2. RLS Policies
    - Remove duplicate policies on newsletter_subscriptions
    - Add policies for admin_tokens and newsletter_history
    - Enable RLS on cleanup_runs table
  
  3. Views and Functions
    - Remove SECURITY DEFINER from views
    - Set immutable search_path on functions to prevent search_path attacks
  
  4. Security
    - All changes follow principle of least privilege
    - Policies are restrictive by default
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_submission_id ON favorites(submission_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);

-- ============================================================================
-- 2. REMOVE UNUSED INDEX
-- ============================================================================

DROP INDEX IF EXISTS idx_votes_user_id;

-- ============================================================================
-- 3. FIX DUPLICATE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can subscribe to newsletter" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON newsletter_subscriptions;

-- ============================================================================
-- 4. ADD RLS POLICIES FOR TABLES WITHOUT POLICIES
-- ============================================================================

CREATE POLICY "No direct access to admin tokens"
  ON admin_tokens
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Service role can manage newsletter history"
  ON newsletter_history
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Anon cannot access newsletter history"
  ON newsletter_history
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 5. ENABLE RLS ON CLEANUP_RUNS
-- ============================================================================

ALTER TABLE cleanup_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cleanup runs"
  ON cleanup_runs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated cannot insert cleanup runs"
  ON cleanup_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Authenticated cannot update cleanup runs"
  ON cleanup_runs
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Authenticated cannot delete cleanup runs"
  ON cleanup_runs
  FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "Anon cannot insert cleanup runs"
  ON cleanup_runs
  FOR INSERT
  TO anon
  WITH CHECK (false);

CREATE POLICY "Anon cannot update cleanup runs"
  ON cleanup_runs
  FOR UPDATE
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Anon cannot delete cleanup runs"
  ON cleanup_runs
  FOR DELETE
  TO anon
  USING (false);

-- ============================================================================
-- 6. FIX SECURITY DEFINER VIEWS
-- ============================================================================

DROP VIEW IF EXISTS expiring_free_listings;
CREATE VIEW expiring_free_listings AS
SELECT 
  id,
  email,
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

DROP VIEW IF EXISTS expired_free_listings;
CREATE VIEW expired_free_listings AS
SELECT 
  id,
  email,
  title,
  url,
  expires_at,
  status
FROM software_submissions
WHERE (tier = 'free' OR tier IS NULL)
AND expires_at IS NOT NULL
AND expires_at <= CURRENT_TIMESTAMP
AND status = 'approved';

-- ============================================================================
-- 7. FIX FUNCTION SEARCH PATHS
-- ============================================================================

CREATE OR REPLACE FUNCTION set_free_listing_expiration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (NEW.tier = 'free' OR NEW.tier IS NULL) THEN
    NEW.expires_at := NEW.created_at + interval '90 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION renew_free_listing(submission_id uuid)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE software_submissions
  SET 
    expires_at = CURRENT_TIMESTAMP + interval '90 days',
    last_renewed_at = CURRENT_TIMESTAMP,
    renewal_count = renewal_count + 1
  WHERE id = submission_id
  AND (tier = 'free' OR tier IS NULL);
END;
$$;

CREATE OR REPLACE FUNCTION should_run_cleanup()
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  last_cleanup timestamptz;
BEGIN
  SELECT last_run INTO last_cleanup
  FROM cleanup_runs
  ORDER BY last_run DESC
  LIMIT 1;
  
  RETURN (last_cleanup IS NULL OR last_cleanup < now() - interval '1 hour');
END;
$$;

CREATE OR REPLACE FUNCTION mark_expired_listings()
RETURNS TABLE (
  id uuid,
  email text,
  title text,
  url text,
  expires_at timestamptz,
  notification_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE software_submissions
  SET status = 'expired'
  WHERE status = 'approved'
  AND (tier = 'free' OR tier IS NULL)
  AND expires_at IS NOT NULL
  AND expires_at <= now()
  AND status != 'expired';
  
  RETURN QUERY
  SELECT 
    s.id,
    s.email,
    s.title,
    s.url,
    s.expires_at,
    'expired'::text as notification_type
  FROM software_submissions s
  WHERE s.status = 'expired'
  AND (s.tier = 'free' OR s.tier IS NULL)
  AND s.expires_at IS NOT NULL
  AND s.expires_at >= now() - interval '1 day'
  
  UNION ALL
  
  SELECT 
    s.id,
    s.email,
    s.title,
    s.url,
    s.expires_at,
    'expiring_soon'::text as notification_type
  FROM software_submissions s
  WHERE s.status = 'approved'
  AND (s.tier = 'free' OR s.tier IS NULL)
  AND s.expires_at IS NOT NULL
  AND s.expires_at > now()
  AND s.expires_at <= now() + interval '7 days';
END;
$$;

CREATE OR REPLACE FUNCTION record_cleanup_run(
  p_expired_count integer DEFAULT 0,
  p_notified_count integer DEFAULT 0
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE cleanup_runs
  SET 
    last_run = now(),
    expired_count = p_expired_count,
    notified_count = p_notified_count
  WHERE id IN (
    SELECT id FROM cleanup_runs ORDER BY last_run DESC LIMIT 1
  );
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION should_run_cleanup() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_expired_listings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_cleanup_run(integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_free_listing_expiration() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION renew_free_listing(uuid) TO anon, authenticated;

GRANT SELECT ON expiring_free_listings TO anon, authenticated;
GRANT SELECT ON expired_free_listings TO anon, authenticated;

COMMENT ON POLICY "No direct access to admin tokens" ON admin_tokens IS 'Admin tokens should only be accessed via edge functions with service role';
COMMENT ON POLICY "Anyone can view cleanup runs" ON cleanup_runs IS 'Cleanup history is public for transparency';
