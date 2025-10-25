/*
  # Add Tier to User Tokens

  1. Changes
    - Add `tier` column to `user_tokens` table to track user's purchased plan
    - Default tier is 'free'
    - Available tiers: 'free', 'basic', 'premium'
    
  2. Tier Limits
    - Free: 1 URL submission
    - Basic: 5 URL submissions
    - Premium: Unlimited URL submissions

  3. Notes
    - Tier is set when user completes payment
    - Free users don't have a user_token entry
*/

-- Add tier column to user_tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_tokens' AND column_name = 'tier'
  ) THEN
    ALTER TABLE user_tokens 
    ADD COLUMN tier text NOT NULL DEFAULT 'basic'
    CHECK (tier IN ('basic', 'premium'));
  END IF;
END $$;

-- Create index for tier lookups
CREATE INDEX IF NOT EXISTS idx_user_tokens_tier ON user_tokens(tier);
CREATE INDEX IF NOT EXISTS idx_user_tokens_email_tier ON user_tokens(email, tier);
