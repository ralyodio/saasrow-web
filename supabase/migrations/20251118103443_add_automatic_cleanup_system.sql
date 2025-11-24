/*
  # Add Automatic Cleanup System

  1. Changes
    - Create table to track last cleanup run
    - Add function to check if cleanup is needed (runs max once per hour)
    - Add function to mark expired listings
    - Add function to get listings needing notification
    
  2. Notes
    - Cleanup runs automatically when anyone queries submissions
    - Prevents excessive cleanup calls (max once per hour)
    - Email sending happens asynchronously via edge function
*/

-- Create table to track cleanup runs
CREATE TABLE IF NOT EXISTS cleanup_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_run timestamptz DEFAULT now(),
  expired_count integer DEFAULT 0,
  notified_count integer DEFAULT 0
);

-- Insert initial record
INSERT INTO cleanup_runs (last_run, expired_count, notified_count)
VALUES (now() - interval '2 hours', 0, 0)
ON CONFLICT DO NOTHING;

-- Function to check if cleanup is needed (once per hour)
CREATE OR REPLACE FUNCTION should_run_cleanup()
RETURNS boolean AS $$
DECLARE
  last_cleanup timestamptz;
BEGIN
  SELECT last_run INTO last_cleanup
  FROM cleanup_runs
  ORDER BY last_run DESC
  LIMIT 1;
  
  -- Run cleanup if more than 1 hour has passed
  RETURN (last_cleanup IS NULL OR last_cleanup < now() - interval '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Function to mark expired listings and return them for notification
CREATE OR REPLACE FUNCTION mark_expired_listings()
RETURNS TABLE (
  id uuid,
  email text,
  title text,
  url text,
  expires_at timestamptz,
  notification_type text
) AS $$
BEGIN
  -- Update expired listings status
  UPDATE software_submissions
  SET status = 'expired'
  WHERE status = 'approved'
  AND (tier = 'free' OR tier IS NULL)
  AND expires_at IS NOT NULL
  AND expires_at <= now()
  AND status != 'expired';
  
  -- Return expired listings for notification
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
  AND s.expires_at >= now() - interval '1 day' -- Only notify for recently expired
  
  UNION ALL
  
  -- Return listings expiring soon (within 7 days) for warning
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
$$ LANGUAGE plpgsql;

-- Function to record cleanup run
CREATE OR REPLACE FUNCTION record_cleanup_run(
  p_expired_count integer DEFAULT 0,
  p_notified_count integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  -- Update the single record
  UPDATE cleanup_runs
  SET 
    last_run = now(),
    expired_count = p_expired_count,
    notified_count = p_notified_count
  WHERE id IN (
    SELECT id FROM cleanup_runs ORDER BY last_run DESC LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON cleanup_runs TO anon, authenticated;
GRANT EXECUTE ON FUNCTION should_run_cleanup() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_expired_listings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_cleanup_run(integer, integer) TO anon, authenticated;

COMMENT ON TABLE cleanup_runs IS 'Tracks when automatic cleanup was last run to prevent excessive executions';
COMMENT ON FUNCTION should_run_cleanup() IS 'Returns true if cleanup should run (max once per hour)';
COMMENT ON FUNCTION mark_expired_listings() IS 'Marks expired listings and returns all that need notifications';
COMMENT ON FUNCTION record_cleanup_run(integer, integer) IS 'Records that cleanup was executed';
