/*
  # Create Increment View Count Function

  1. New Functions
    - `increment_view_count(submission_id uuid)`
      - Atomically increments the view_count for a submission
      - Returns the updated view count
      - Uses UPDATE with RETURNING for atomic operation
  
  2. Security
    - Function is SECURITY DEFINER to allow anyone to increment views
    - Only allows incrementing, not decrementing or setting arbitrary values
*/

CREATE OR REPLACE FUNCTION increment_view_count(submission_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE software_submissions
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = submission_id
  RETURNING view_count INTO new_count;
  
  RETURN new_count;
END;
$$;
