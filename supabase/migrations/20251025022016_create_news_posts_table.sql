/*
  # Create news posts table

  1. New Tables
    - `news_posts`
      - `id` (uuid, primary key) - Unique identifier for each post
      - `slug` (text, unique) - URL-friendly identifier
      - `title` (text) - Post title
      - `excerpt` (text) - Short description for listings
      - `content` (text) - Full HTML content of the post
      - `published` (boolean) - Whether the post is published
      - `created_at` (timestamptz) - When the post was created
      - `updated_at` (timestamptz) - When the post was last updated

  2. Security
    - Enable RLS on `news_posts` table
    - Add policy for public read access to published posts
    - Add policy for authenticated admins to manage posts
*/

CREATE TABLE IF NOT EXISTS news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
  ON news_posts
  FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can view all posts"
  ON news_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert posts"
  ON news_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update posts"
  ON news_posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete posts"
  ON news_posts
  FOR DELETE
  TO authenticated
  USING (true);
