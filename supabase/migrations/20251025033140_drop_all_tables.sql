/*
  # Drop All Tables

  Completely wipes the database clean by dropping all tables and related objects.
  
  ## Tables Dropped
  - news_posts
  - user_tokens
  - stripe_orders
  - stripe_subscriptions
  - stripe_customers
  - social_links
  - community_posts
  - software_submissions
  - newsletter_subscriptions
  
  ## Custom Types Dropped
  - stripe_subscription_status
  - stripe_order_status
  
  ## Storage Buckets
  - Will need to be dropped separately via storage API
*/

-- Drop tables in order (respect foreign key dependencies)
DROP TABLE IF EXISTS news_posts CASCADE;
DROP TABLE IF EXISTS user_tokens CASCADE;
DROP TABLE IF EXISTS stripe_orders CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;
DROP TABLE IF EXISTS social_links CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS software_submissions CASCADE;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS stripe_subscription_status CASCADE;
DROP TYPE IF EXISTS stripe_order_status CASCADE;
