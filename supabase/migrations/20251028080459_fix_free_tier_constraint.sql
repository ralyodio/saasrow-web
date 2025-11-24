/*
  # Fix Free Tier Constraint Issue

  ## Overview
  Removes the conflicting tier constraint that was blocking free tier submissions.

  ## Changes
  1. Drop the restrictive `valid_tier_check` constraint that only allows 'featured' and 'premium'
  2. Keep the correct `valid_tier` constraint that allows 'free', 'featured', and 'premium'

  ## Important Notes
  - This fixes the error: "new row for relation \"software_submissions\" violates check constraint \"valid_tier\""
  - The main `valid_tier` constraint already properly validates all three tiers
  - Safe to run multiple times (uses IF EXISTS)
*/

-- Drop the conflicting constraint that doesn't allow 'free'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_tier_check'
    AND table_name = 'software_submissions'
  ) THEN
    ALTER TABLE software_submissions DROP CONSTRAINT valid_tier_check;
  END IF;
END $$;
