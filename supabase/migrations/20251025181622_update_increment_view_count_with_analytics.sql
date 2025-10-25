/*
  # Update Increment View Count Function with Analytics

  1. Changes
    - Modified `increment_view_count(submission_id uuid)` function
    - Now updates both `software_submissions.view_count` and `submission_analytics_daily` table
    - Uses INSERT ... ON CONFLICT to upsert daily analytics records
    - Atomically increments view count and tracks daily views
  
  2. Details
    - Updates `software_submissions.view_count` column (existing behavior)
    - Inserts or updates `submission_analytics_daily` for today's date
    - If record exists for today, increments the views count
    - If no record exists, creates new record with views = 1
  
  3. Security
    - Function remains SECURITY DEFINER to allow anyone to increment views
    - Only allows incrementing, not decrementing or setting arbitrary values
*/

CREATE OR REPLACE FUNCTION increment_view_count(submission_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
  today_date date;
BEGIN
  -- Get today's date
  today_date := CURRENT_DATE;
  
  -- Update view count in software_submissions
  UPDATE software_submissions
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = submission_id
  RETURNING view_count INTO new_count;
  
  -- Update or insert daily analytics
  INSERT INTO submission_analytics_daily (submission_id, date, views, clicks, unique_visitors)
  VALUES (submission_id, today_date, 1, 0, 0)
  ON CONFLICT (submission_id, date)
  DO UPDATE SET
    views = submission_analytics_daily.views + 1;
  
  RETURN new_count;
END;
$$;
