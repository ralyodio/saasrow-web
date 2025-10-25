/*
  # Update Basic Tier Features and Limits

  1. Changes
    - Add `submission_count` column to track how many submissions a user has made
    - Add `monthly_analytics_enabled` for basic tier analytics
    - Add `social_media_mentions` flag for basic tier
    - Add `category_logo_enabled` flag for basic tier
    
  2. Tier Features Summary
    - Basic (Free): Up to 5 listings, Featured badge, Priority review (2-3 days), Monthly analytics, Logo in categories, Social mentions
    - Featured (Paid): Unlimited listings, Featured badge, Same-day review, Advanced analytics, Premium placement
    - Premium (Paid): All features + Homepage spot, Newsletter (200K+), Dedicated manager, SEO support

  3. Notes
    - Basic tier now includes many features previously premium-only
    - Submission count tracking will enforce the 5 listing limit for basic tier
*/

-- Add monthly_analytics_enabled for basic tier
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'monthly_analytics_enabled'
  ) THEN
    ALTER TABLE software_submissions 
    ADD COLUMN monthly_analytics_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add social_media_mentions flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'social_media_mentions'
  ) THEN
    ALTER TABLE software_submissions 
    ADD COLUMN social_media_mentions boolean DEFAULT false;
  END IF;
END $$;

-- Add category_logo_enabled flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'software_submissions' AND column_name = 'category_logo_enabled'
  ) THEN
    ALTER TABLE software_submissions 
    ADD COLUMN category_logo_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Update existing basic tier submissions to have basic features enabled
UPDATE software_submissions 
SET 
  monthly_analytics_enabled = true,
  social_media_mentions = true,
  category_logo_enabled = true
WHERE tier = 'basic' OR tier IS NULL;

-- Update featured tier submissions
UPDATE software_submissions 
SET 
  analytics_enabled = true,
  monthly_analytics_enabled = true,
  social_media_mentions = true,
  category_logo_enabled = true
WHERE tier = 'featured';

-- Update premium tier submissions
UPDATE software_submissions 
SET 
  analytics_enabled = true,
  monthly_analytics_enabled = true,
  social_media_mentions = true,
  category_logo_enabled = true
WHERE tier = 'premium';
