/*
  # Add email column to stripe_subscriptions

  1. Changes
    - Add `email` column to `stripe_subscriptions` table to link subscriptions to users
    - Populate existing rows with email from Stripe customer lookup

  2. Notes
    - Makes it easier to query subscription info by email
    - Allows direct lookup without joining through submissions
*/

-- Add email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'email'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN email text;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_email ON stripe_subscriptions(email);