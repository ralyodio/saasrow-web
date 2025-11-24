/*
  # Add Free Listing Expiration System

  1. Changes
    - Add `expires_at` column to track when free listings expire (90 days from creation)
    - Add `last_renewed_at` column to track renewal history
    - Add `renewal_count` column to track how many times listing was renewed
    
  2. Notes
    - Only free tier listings will have expiration dates
    - Paid tiers (featured/premium) have NULL expires_at (never expire)
    - Expired listings will be automatically archived but not deleted
    - Users can renew free listings before expiration
*/

-- Add expiration tracking columns
ALTER TABLE software_submissions 
ADD COLUMN IF NOT EXISTS expires_at timestamptz,
ADD COLUMN IF NOT EXISTS last_renewed_at timestamptz,
ADD COLUMN IF NOT EXISTS renewal_count integer DEFAULT 0;

-- Set expiration for existing free tier submissions (90 days from creation)
UPDATE software_submissions 
SET expires_at = created_at + interval '90 days'
WHERE (tier = 'free' OR tier IS NULL) 
AND expires_at IS NULL;

-- Create function to automatically set expiration for new free listings
CREATE OR REPLACE FUNCTION set_free_listing_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set expiration for free tier
  IF (NEW.tier = 'free' OR NEW.tier IS NULL) THEN
    NEW.expires_at := NEW.created_at + interval '90 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set expiration on insert
DROP TRIGGER IF EXISTS set_expiration_on_insert ON software_submissions;
CREATE TRIGGER set_expiration_on_insert
  BEFORE INSERT ON software_submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_free_listing_expiration();

-- Create function to renew free listing
CREATE OR REPLACE FUNCTION renew_free_listing(submission_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE software_submissions
  SET 
    expires_at = CURRENT_TIMESTAMP + interval '90 days',
    last_renewed_at = CURRENT_TIMESTAMP,
    renewal_count = renewal_count + 1
  WHERE id = submission_id
  AND (tier = 'free' OR tier IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Create view for expiring listings (expire in 7 days)
CREATE OR REPLACE VIEW expiring_free_listings AS
SELECT 
  id,
  email,
  title,
  url,
  expires_at,
  renewal_count
FROM software_submissions
WHERE (tier = 'free' OR tier IS NULL)
AND expires_at IS NOT NULL
AND expires_at > CURRENT_TIMESTAMP
AND expires_at <= CURRENT_TIMESTAMP + interval '7 days'
AND status = 'approved';

-- Create view for expired listings
CREATE OR REPLACE VIEW expired_free_listings AS
SELECT 
  id,
  email,
  title,
  url,
  expires_at,
  status
FROM software_submissions
WHERE (tier = 'free' OR tier IS NULL)
AND expires_at IS NOT NULL
AND expires_at <= CURRENT_TIMESTAMP
AND status = 'approved';

COMMENT ON COLUMN software_submissions.expires_at IS 'Free tier listings expire after 90 days. NULL for paid tiers (never expire)';
COMMENT ON COLUMN software_submissions.last_renewed_at IS 'Timestamp of last renewal for free listings';
COMMENT ON COLUMN software_submissions.renewal_count IS 'Number of times free listing has been renewed';
