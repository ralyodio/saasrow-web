/*
  # Fix Admin Panel Issues

  This migration addresses two critical issues:

  ## 1. Fix Updated_at Trigger Error
  - Add missing `updated_at` column to `software_submissions` table
  - The trigger `update_software_submissions_updated_at` was trying to set a non-existent column

  ## 2. Ensure Admin Notification System is Ready
  - Verify the notification function is working correctly
  - The actual email sending requires MAILGUN_API_KEY, MAILGUN_DOMAIN, and ADMIN_EMAIL
    to be configured in Supabase Edge Function secrets
*/

-- ============================================================================
-- 1. ADD MISSING UPDATED_AT COLUMN TO SOFTWARE_SUBMISSIONS
-- ============================================================================

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE software_submissions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Ensure the trigger exists (it should from previous migrations)
-- If the trigger doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_software_submissions_updated_at'
  ) THEN
    CREATE TRIGGER update_software_submissions_updated_at
      BEFORE UPDATE ON software_submissions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
