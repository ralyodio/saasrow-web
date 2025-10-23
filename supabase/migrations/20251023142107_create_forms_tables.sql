/*
  # Create Forms Tables

  ## Overview
  This migration creates the database schema for handling form submissions in the SaaSRow application.

  ## New Tables
  
  ### 1. `newsletter_subscriptions`
  - `id` (uuid, primary key) - Unique identifier
  - `email` (text, unique) - Subscriber email address
  - `subscribed_at` (timestamptz) - Subscription timestamp
  - `is_active` (boolean) - Active subscription status
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 2. `software_submissions`
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text) - Software title
  - `url` (text) - Software URL
  - `description` (text) - Software description
  - `status` (text) - Submission status (pending, approved, rejected)
  - `submitted_at` (timestamptz) - Submission timestamp
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 3. `community_posts`
  - `id` (uuid, primary key) - Unique identifier
  - `author` (text) - Post author name
  - `title` (text) - Post title
  - `excerpt` (text) - Post excerpt/content
  - `likes` (integer) - Number of likes
  - `comments` (integer) - Number of comments
  - `created_at` (timestamptz) - Post creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Public read access for approved submissions and posts
  - Authenticated users can create submissions
  - Only service role can approve/reject submissions

  ## Indexes
  - Email index on newsletter_subscriptions for quick lookups
  - Status index on software_submissions for filtering
  - Created_at indexes for sorting
*/

-- Newsletter Subscriptions Table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_created_at ON newsletter_subscriptions(created_at DESC);

ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscriptions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view active subscriptions"
  ON newsletter_subscriptions FOR SELECT
  TO anon
  USING (is_active = true);

-- Software Submissions Table
CREATE TABLE IF NOT EXISTS software_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT valid_url CHECK (url ~* '^https?://.*')
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON software_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON software_submissions(created_at DESC);

ALTER TABLE software_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit software"
  ON software_submissions FOR INSERT
  TO anon
  WITH CHECK (status = 'pending');

CREATE POLICY "Anyone can view approved submissions"
  ON software_submissions FOR SELECT
  TO anon
  USING (status = 'approved');

-- Community Posts Table
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

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_likes ON community_posts(likes DESC);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON community_posts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create posts"
  ON community_posts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update post counts"
  ON community_posts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
