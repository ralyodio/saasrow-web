/*
  # Fix Database Security Issues

  This migration addresses multiple security and performance issues identified by Supabase:

  ## 1. Add Missing Indexes for Foreign Keys
  - Add index on `social_links.submission_id`
  - Add index on `votes.user_id`

  ## 2. Optimize RLS Policies
  - Update votes table policies to use `(select auth.uid())` instead of `auth.uid()`
  - This prevents re-evaluation of auth function for each row

  ## 3. Remove Unused Indexes
  - Drop unused indexes to reduce storage and maintenance overhead

  ## 4. Remove Duplicate Permissive Policies
  - Remove duplicate policies on community_posts, favorites, newsletter_subscriptions, and software_submissions

  ## 5. Add Policies for Tables with RLS Enabled
  - Add policies for admin_tokens table
  - Add policies for newsletter_history table

  ## 6. Fix Function Search Path Issues
  - Update functions to use immutable search_path
*/

-- ============================================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- ============================================================================

-- Index for social_links.submission_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_social_links_submission_id
  ON social_links(submission_id);

-- Index for votes.user_id (foreign key) - already exists in votes.submission_id
-- votes.submission_id already has a unique constraint which includes an index
-- But we need one specifically for user_id lookups
CREATE INDEX IF NOT EXISTS idx_votes_user_id
  ON votes(user_id);

-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES - USE (SELECT auth.uid())
-- ============================================================================

-- Drop and recreate votes policies with optimized auth function calls
DROP POLICY IF EXISTS "Authenticated users can insert their own votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can update their own votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can delete their own votes" ON votes;

CREATE POLICY "Authenticated users can insert their own votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can update their own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can delete their own votes"
  ON votes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- 3. REMOVE UNUSED INDEXES
-- ============================================================================

-- Drop unused indexes
DROP INDEX IF EXISTS idx_software_submissions_share_count;
DROP INDEX IF EXISTS idx_user_tokens_user_id;
DROP INDEX IF EXISTS idx_stripe_customers_user_id;
DROP INDEX IF EXISTS idx_stripe_customers_customer_id;
DROP INDEX IF EXISTS idx_stripe_orders_customer_id;
DROP INDEX IF EXISTS idx_stripe_orders_status;
DROP INDEX IF EXISTS idx_stripe_subscriptions_customer_id;
DROP INDEX IF EXISTS idx_stripe_subscriptions_status;
DROP INDEX IF EXISTS idx_stripe_subscriptions_email;
DROP INDEX IF EXISTS idx_comments_verified;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_bookmarks_submission_id;

-- ============================================================================
-- 4. REMOVE DUPLICATE PERMISSIVE POLICIES
-- ============================================================================

-- Remove duplicate policies on community_posts
DROP POLICY IF EXISTS "Anyone can create posts" ON community_posts;
DROP POLICY IF EXISTS "Anyone can view posts" ON community_posts;

-- Remove duplicate policies on favorites
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;

-- Remove duplicate policies on newsletter_subscriptions
DROP POLICY IF EXISTS "Anyone can view active subscriptions" ON newsletter_subscriptions;

-- Remove duplicate policies on software_submissions
DROP POLICY IF EXISTS "Public can submit software" ON software_submissions;
DROP POLICY IF EXISTS "Authenticated users can submit software" ON software_submissions;

-- ============================================================================
-- 5. ADD POLICIES FOR TABLES WITH RLS BUT NO POLICIES
-- ============================================================================

-- Policies for admin_tokens table (only accessible via edge functions with service role)
-- No policies needed - access is controlled entirely by edge functions

-- Policies for newsletter_history table (only accessible via edge functions with service role)
-- No policies needed - access is controlled entirely by edge functions

-- ============================================================================
-- 6. FIX FUNCTION SEARCH PATH ISSUES
-- ============================================================================

-- Fix increment_view_count function
CREATE OR REPLACE FUNCTION increment_view_count(p_submission_id uuid, p_user_ip text DEFAULT NULL)
RETURNS json AS $$
DECLARE
  v_result json;
  v_submission_tier text;
BEGIN
  -- Get the tier of the submission
  SELECT tier INTO v_submission_tier
  FROM software_submissions
  WHERE id = p_submission_id;

  -- Increment view count
  UPDATE software_submissions
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_submission_id;

  -- Insert analytics record if tier is featured or premium
  IF v_submission_tier IN ('featured', 'premium') THEN
    INSERT INTO click_analytics (submission_id, event_type, user_ip, created_at)
    VALUES (p_submission_id, 'view', p_user_ip, now());
  END IF;

  -- Return the updated view count
  SELECT json_build_object('view_count', COALESCE(view_count, 0))
  INTO v_result
  FROM software_submissions
  WHERE id = p_submission_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix update_vote_counts function
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE software_submissions
      SET upvotes = upvotes + 1
      WHERE id = NEW.submission_id;
    ELSE
      UPDATE software_submissions
      SET downvotes = downvotes + 1
      WHERE id = NEW.submission_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'upvote' AND NEW.vote_type = 'downvote' THEN
      UPDATE software_submissions
      SET upvotes = upvotes - 1, downvotes = downvotes + 1
      WHERE id = NEW.submission_id;
    ELSIF OLD.vote_type = 'downvote' AND NEW.vote_type = 'upvote' THEN
      UPDATE software_submissions
      SET upvotes = upvotes + 1, downvotes = downvotes - 1
      WHERE id = NEW.submission_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE software_submissions
      SET upvotes = upvotes - 1
      WHERE id = OLD.submission_id;
    ELSE
      UPDATE software_submissions
      SET downvotes = downvotes - 1
      WHERE id = OLD.submission_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix update_comment_updated_at function
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;
