/*
  # Fix Ambiguous Column Reference in increment_view_count Function

  1. Changes
    - Drop and recreate `increment_view_count` function
    - Renamed function parameter from `submission_id` to `p_submission_id`
    - This prevents ambiguity with the `submission_id` column name in the INSERT statement
  
  2. Why This Fix Is Needed
    - The original function had a parameter named `submission_id` 
    - When inserting into `submission_analytics_daily`, PostgreSQL couldn't tell if `submission_id`
      referred to the function parameter or the table column
    - This caused the function to fail silently (error not propagated to frontend)
  
  3. Impact
    - Views will now be properly tracked in both tables
    - Daily analytics will correctly increment
*/

DROP FUNCTION IF EXISTS increment_view_count(uuid);

CREATE FUNCTION increment_view_count(p_submission_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
  today_date date;
BEGIN
  today_date := CURRENT_DATE;
  
  UPDATE software_submissions
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_submission_id
  RETURNING view_count INTO new_count;
  
  INSERT INTO submission_analytics_daily (submission_id, date, views, clicks, unique_visitors)
  VALUES (p_submission_id, today_date, 1, 0, 0)
  ON CONFLICT (submission_id, date)
  DO UPDATE SET
    views = submission_analytics_daily.views + 1;
  
  RETURN new_count;
END;
$$;
