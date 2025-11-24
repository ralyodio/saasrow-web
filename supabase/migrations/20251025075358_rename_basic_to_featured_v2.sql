/*
  # Rename 'basic' tier to 'featured' for consistency

  1. Changes
    - Drop existing constraint first
    - Update existing 'basic' tier records to 'featured' in user_tokens
    - Add new constraint with 'featured' instead of 'basic'
    - Ensure consistency across all tier references

  2. Security
    - No RLS changes needed
    
  3. Notes
    - This ensures tier naming is consistent across the entire application
    - 'featured' tier provides 5 total listings
*/

-- Drop the old constraint first
ALTER TABLE user_tokens
DROP CONSTRAINT IF EXISTS valid_tier_check;

-- Update existing basic tier records to featured in user_tokens
UPDATE user_tokens
SET tier = 'featured'
WHERE tier = 'basic';

-- Add new constraint with 'featured' instead of 'basic'
ALTER TABLE user_tokens
ADD CONSTRAINT valid_tier_check
CHECK (tier IN ('featured', 'premium'));

-- Update default value
ALTER TABLE user_tokens
ALTER COLUMN tier SET DEFAULT 'featured';
