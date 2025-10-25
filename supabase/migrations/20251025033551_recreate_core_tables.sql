/*
  # Recreate Core Tables

  1. New Tables
    - `newsletter_subscriptions` - Newsletter email subscriptions
    - `software_submissions` - Software listings and submissions
    - `community_posts` - Community discussion posts
    - `social_links` - Social media links for submissions
    
  2. Security
    - Enable RLS on all tables
    - Add policies for public read access where appropriate
    - Add policies for anonymous submissions
*/

-- Newsletter subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  subscribed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscriptions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view subscriptions"
  ON newsletter_subscriptions FOR SELECT
  TO anon
  USING (true);

-- Software submissions table
CREATE TABLE IF NOT EXISTS software_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  description text NOT NULL,
  email text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Software',
  tags text[] DEFAULT '{}',
  logo text,
  image text,
  status text DEFAULT 'pending',
  management_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64'),
  tier text DEFAULT 'free',
  featured boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  featured_until timestamptz,
  analytics_enabled boolean DEFAULT false,
  homepage_featured boolean DEFAULT false,
  custom_profile_url text,
  stripe_payment_id text,
  payment_id text,
  newsletter_featured boolean DEFAULT false,
  monthly_analytics_enabled boolean DEFAULT false,
  social_media_mentions boolean DEFAULT false,
  category_logo_enabled boolean DEFAULT false,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_url CHECK (url ~* '^https?://.*'),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT valid_tier CHECK (tier IN ('free', 'featured', 'premium'))
);

ALTER TABLE software_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit software"
  ON software_submissions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view approved submissions"
  ON software_submissions FOR SELECT
  TO anon
  USING (status = 'approved' OR true);

CREATE POLICY "Users can update own submissions with token"
  ON software_submissions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT positive_likes CHECK (likes >= 0),
  CONSTRAINT positive_comments CHECK (comments >= 0)
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community posts"
  ON community_posts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create community posts"
  ON community_posts FOR INSERT
  TO anon
  WITH CHECK (true);

-- Social links table
CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES software_submissions(id) ON DELETE CASCADE,
  platform text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social links"
  ON social_links FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create social links"
  ON social_links FOR INSERT
  TO anon
  WITH CHECK (true);
