/*
  # Fix increment_view_count Function

  1. Problem
    - Multiple versions of increment_view_count function exist in database
    - The version being called doesn't update submission_analytics_daily table
    - This causes view counts to remain at 0

  2. Solution
    - Drop all existing increment_view_count functions
    - Create single, correct function that updates both:
      * software_submissions.view_count
      * submission_analytics_daily.views

  3. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Proper search_path set for security
*/

-- Drop all existing versions
DROP FUNCTION IF EXISTS increment_view_count(uuid);
DROP FUNCTION IF EXISTS increment_view_count(uuid, text);

-- Create the correct function
CREATE OR REPLACE FUNCTION increment_view_count(p_submission_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  new_count integer;
  today_date date;
BEGIN
  today_date := CURRENT_DATE;
  
  -- Increment view count in submissions table
  UPDATE software_submissions
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_submission_id
  RETURNING view_count INTO new_count;
  
  -- Update daily analytics
  INSERT INTO submission_analytics_daily (submission_id, date, views, clicks, unique_visitors)
  VALUES (p_submission_id, today_date, 1, 0, 0)
  ON CONFLICT (submission_id, date)
  DO UPDATE SET
    views = submission_analytics_daily.views + 1;
  
  RETURN new_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO anon, authenticated, service_role;
