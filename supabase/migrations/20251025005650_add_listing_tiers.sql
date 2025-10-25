/*
  # Add Listing Tiers to Software Submissions

  1. Changes
    - Add `tier` column to `software_submissions` table
    - Default tier is 'basic' (free)
    - Available tiers: 'basic', 'featured', 'premium'
    - Add `featured_until` column for time-based featured status
    - Add `analytics_enabled` column for premium analytics
    
  2. Features by Tier
    - Basic: Standard listing
    - Featured: Badge on listing, priority in search
    - Premium: All features including homepage spot, analytics, newsletter, dedicated manager

  3. Notes
    - Featured listings can be time-limited
    - Premium listings get unlimited duration
*/

-- Add tier column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'tier'
  ) THEN
    ALTER TABLE software_submissions 
    ADD COLUMN tier text NOT NULL DEFAULT 'basic'
    CHECK (tier IN ('basic', 'featured', 'premium'));
  END IF;
END $$;

-- Add featured_until for time-based featured status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'featured_until'
  ) THEN
    ALTER TABLE software_submissions 
    ADD COLUMN featured_until timestamptz;
  END IF;
END $$;

-- Add analytics_enabled flag for premium features
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'analytics_enabled'
  ) THEN
    ALTER TABLE software_submissions 
    ADD COLUMN analytics_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add homepage_featured flag for premium homepage spot
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'homepage_featured'
  ) THEN
    ALTER TABLE software_submissions 
    ADD COLUMN homepage_featured boolean DEFAULT false;
  END IF;
END $$;

-- Add newsletter_featured flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'newsletter_featured'
  ) THEN
    ALTER TABLE software_submissions 
    ADD COLUMN newsletter_featured boolean DEFAULT false;
  END IF;
END $$;

-- Create index for tier filtering
CREATE INDEX IF NOT EXISTS idx_submissions_tier ON software_submissions(tier);
CREATE INDEX IF NOT EXISTS idx_submissions_homepage_featured ON software_submissions(homepage_featured) WHERE homepage_featured = true;
